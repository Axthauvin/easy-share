#!/usr/bin/env node
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const os = require("os");
const path = require("path");
const QRCode = require("qrcode");

const app = express();
const port = 3000;

const fs = require("fs");

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/flags",
  express.static(path.join(__dirname, "node_modules/flag-icons")),
);

// Create a temp folder for storing uploads
const uploadDir = path.join(os.tmpdir(), "easy-share-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const files = new Map();

// HTTP upload endpoint (streams directly to disk)
app.post("/upload/:id", (req, res) => {
  const fileId = req.params.id;
  const tempFilePath = path.join(uploadDir, fileId);
  const writeStream = fs.createWriteStream(tempFilePath);

  req.pipe(writeStream);

  writeStream.on("finish", () => {
    files.set(fileId, {
      path: tempFilePath,
      name: req.query.name || "file",
      contentType: req.headers["content-type"] || "application/octet-stream",
    });

    // Auto-clean from disk after 20 minutes
    setTimeout(
      () => {
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (err) {
          console.error("Error cleaning up temp file:", err);
        }
        files.delete(fileId);
      },
      20 * 60 * 1000,
    );

    res.sendStatus(200);
  });

  writeStream.on("error", (err) => {
    console.error("Upload stream error:", err);
    res.sendStatus(500);
  });
});

// HTTP download endpoint (streams directly from disk)
app.get("/download/:id", (req, res) => {
  const file = files.get(req.params.id);
  if (!file || !fs.existsSync(file.path)) {
    return res.status(404).send("Fichier non trouvé ou expiré.");
  }

  res.setHeader("Content-Type", file.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.name)}"`,
  );

  const readStream = fs.createReadStream(file.path);
  readStream.pipe(res);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();
let hostConnectedAtLeastOnce = false;
let hostExitTimer = null;
const messageHistory = [];
const MAX_HISTORY = 100;

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();

    // identify virtual or VPN interfaces
    const isVirtualOrVpn =
      lowerName.includes("virtual") ||
      lowerName.includes("vethernet") ||
      lowerName.includes("docker") ||
      lowerName.includes("vbox") ||
      lowerName.includes("vmware") ||
      lowerName.includes("wsl") ||
      lowerName.includes("vpn") ||
      lowerName.includes("loopback");

    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        const ip = iface.address;

        // exclude link-local addresses (169.254.x.x) which are often not useful for local network communication
        if (ip.startsWith("169.254.")) {
          continue;
        }

        let score = 0;

        // priority on wifi
        if (
          lowerName.includes("wi-fi") ||
          lowerName.includes("wlan") ||
          lowerName.includes("wireless")
        ) {
          score += 100;
        }
        // priority on physical Ethernet
        else if (
          lowerName.includes("ethernet") ||
          lowerName.includes("eth") ||
          lowerName.includes("en")
        ) {
          score += 80;
        }

        // penalize virtual or VPN adapters
        if (isVirtualOrVpn) {
          score -= 150;
        }

        // exclude addresses ending in .1 (often virtual gateways for WSL/Docker)
        if (ip.endsWith(".1")) {
          score -= 50;
        }

        candidates.push({ ip, score });
      }
    }
  }

  // sort candidates from highest to lowest score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.map((c) => c.ip);
}

function getDeviceName(ua) {
  if (!ua) return "Appareil distant";
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iPhone / iPad";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "PC Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Appareil";
}

function broadcastClientsList() {
  const clientsList = Array.from(clients.values()).map((c) => ({
    id: c.id,
    name: c.name,
    ip: c.ip,
  }));

  const payload = JSON.stringify({
    type: "clients_list",
    clients: clientsList,
  });

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function getHistoryFor(clientId) {
  return messageHistory.filter((msg) => {
    return (
      msg.targetId === "all" ||
      msg.targetId === clientId ||
      msg.senderId === clientId
    );
  });
}

wss.on("connection", (ws, req) => {
  const rawIp = req.socket.remoteAddress || "127.0.0.1";
  const clientIp = rawIp.replace(/^.*:/, "") || "127.0.0.1";
  const isHost =
    rawIp === "::1" || rawIp === "127.0.0.1" || rawIp.endsWith("127.0.0.1");

  if (isHost) {
    hostConnectedAtLeastOnce = true;
    if (hostExitTimer) {
      clearTimeout(hostExitTimer);
      hostExitTimer = null;
    }
  }

  const userAgent = req.headers["user-agent"];
  const baseName = getDeviceName(userAgent);

  const clientId = "c_" + Math.random().toString(36).substring(2, 9);

  const existingNames = Array.from(clients.values()).map((c) => c.name);
  let clientName = baseName;
  let counter = 2;
  while (existingNames.includes(clientName)) {
    clientName = `${baseName} ${counter}`;
    counter++;
  }

  console.log(`[Connect] ${clientName} [ID: ${clientId}]`);

  clients.set(clientId, {
    ws,
    id: clientId,
    name: clientName,
    ip: clientIp,
    isHost,
  });

  const localIps = getLocalIPs();
  const primaryIp = localIps[0] || "localhost";
  const serverUrl = `http://${primaryIp}:${port}`;

  QRCode.toDataURL(
    serverUrl,
    {
      margin: 1,
      width: 256,
      color: {
        dark: "#1d1d1f",
        light: "#ffffff",
      },
    },
    (err, qrDataUrl) => {
      const initPayload = {
        type: "init",
        clientId: clientId,
        serverUrl: serverUrl,
        history: getHistoryFor(clientId),
      };

      if (!err) {
        initPayload.qrCode = qrDataUrl;
      }

      ws.send(JSON.stringify(initPayload));
      broadcastClientsList();
    },
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "share_text" || data.type === "share_file") {
        const targetId = data.targetId || "all";
        const senderInfo = clients.get(clientId);

        const newMessage = {
          id:
            "m_" +
            Date.now().toString(36) +
            Math.random().toString(36).substring(2, 5),
          type: data.type === "share_file" ? "file" : "text",
          text: data.text || "",
          fileName: data.fileName || "",
          fileType: data.fileType || "",
          fileSize: data.fileSize || 0,
          fileId: data.fileId || null,
          sender: senderInfo ? senderInfo.name : "Inconnu",
          senderId: clientId,
          targetId: targetId,
          timestamp: new Date().toISOString(),
        };

        messageHistory.push(newMessage);
        if (messageHistory.length > MAX_HISTORY) {
          messageHistory.shift();
        }

        const payload = JSON.stringify({
          type: "new_message",
          message: newMessage,
        });

        if (targetId === "all") {
          clients.forEach((c) => {
            if (c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(payload);
            }
          });
        } else {
          const targetClient = clients.get(targetId);
          if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
            targetClient.ws.send(payload);
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
          }
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`[Disconnect] ${clientName} [ID: ${clientId}]`);
    clients.delete(clientId);
    broadcastClientsList();

    if (hostConnectedAtLeastOnce && isHost) {
      const hasHost = Array.from(clients.values()).some((c) => c.isHost);
      if (!hasHost) {
        hostExitTimer = setTimeout(() => {
          const stillHasHost = Array.from(clients.values()).some(
            (c) => c.isHost,
          );
          if (!stillHasHost) {
            console.log("Host closed tab. Exiting server...");
            process.exit(0);
          }
        }, 3000);
      }
    }
  });
});

server.listen(port, "0.0.0.0", () => {
  const localIps = getLocalIPs();
  console.log("\n==================================================");
  console.log("🚀 Easy-Share Server Started!");
  console.log(`Access locally:      http://localhost:${port}`);

  if (localIps.length > 0) {
    console.log("\nAccess from other devices on the same network:");
    localIps.forEach((ip) => {
      console.log(`👉 http://${ip}:${port}`);
    });
  } else {
    console.log("\nNo active local network interfaces found.");
  }
  console.log("==================================================\n");
});

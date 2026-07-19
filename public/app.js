const statusIndicator = document.getElementById("connection-status");
const statusText = statusIndicator.querySelector(".status-text");
const myDeviceName = document.getElementById("my-device-name");
const emptyState = document.getElementById("empty-state");
const devicesContainer = document.getElementById("devices-container");

const desktopQrcodeImg = document.getElementById("desktop-qrcode-img");
const desktopQrcodePlaceholder = document.getElementById(
  "desktop-qrcode-placeholder",
);
const desktopCopyBtn = document.getElementById("desktop-copy-btn");

const burgerMenuBtn = document.getElementById("burger-menu-btn");
const mobileQrModal = document.getElementById("mobile-qr-modal");
const mobileQrClose = document.getElementById("mobile-qr-close");
const mobileQrcodeImg = document.getElementById("mobile-qrcode-img");
const mobileQrcodePlaceholder = document.getElementById(
  "mobile-qrcode-placeholder",
);
const mobileCopyBtn = document.getElementById("mobile-copy-btn");

const sendModal = document.getElementById("send-modal");
const sendModalClose = document.getElementById("send-modal-close");
const sendModalTitle = document.getElementById("send-modal-title");
const textInput = document.getElementById("text-input");
const fileInput = document.getElementById("file-input");
const modalDropZone = document.getElementById("modal-drop-zone");
const selectedFileBadge = document.getElementById("selected-file-badge");
const fileNameText = selectedFileBadge.querySelector(".file-name-text");
const cancelFileBtn = document.getElementById("cancel-file-btn");
const sendBtn = document.getElementById("send-btn");

const receivedModal = document.getElementById("received-modal");
const receivedModalClose = document.getElementById("received-modal-close");
const receivedModalTitle = document.getElementById("received-modal-title");
const receivedModalBody = document.getElementById("received-modal-body");
const receivedCloseBtn = document.getElementById("received-close-btn");

const aboutModal = document.getElementById("about-modal");
const aboutTriggerBtn = document.getElementById("about-trigger-btn");
const aboutModalClose = document.getElementById("about-modal-close");
const aboutCloseBtn = document.getElementById("about-close-btn");

const troubleModal = document.getElementById("trouble-modal");
const desktopTroubleBtn = document.getElementById("desktop-trouble-btn");
const mobileTroubleBtn = document.getElementById("mobile-trouble-btn");
const troubleModalClose = document.getElementById("trouble-modal-close");
const troubleCloseBtn = document.getElementById("trouble-close-btn");

const langDropdown = document.getElementById("lang-dropdown");
const langDropdownTrigger = document.getElementById("lang-dropdown-trigger");
const langCurrentLabel = document.getElementById("lang-current-label");
const langOptions = document.querySelectorAll(".lang-option");

const langLabels = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

let socket = null;
let reconnectTimeout = null;
let serverUrl = "";
let myClientId = "";
let connectedClients = [];
let activeTargetId = "";
let selectedFile = null;
let currentLang = "en";

const i18n = { fr, en, es, de, it, pt };

const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;

const monitorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-monitor"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;
const smartphoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;

function getTranslation(key) {
  if (i18n[currentLang] && i18n[currentLang][key]) {
    return i18n[currentLang][key];
  }
  if (i18n["en"] && i18n["en"][key]) {
    return i18n["en"][key];
  }
  return key;
}

function applyLanguage(lang) {
  currentLang = lang;

  langCurrentLabel.textContent = langLabels[lang] || lang;
  langOptions.forEach((opt) => {
    opt.classList.toggle("active", opt.dataset.lang === lang);
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    // Avoid overwriting elements whose state has been resolved (like custom device name or server URL)
    if (
      el.id === "my-device-name" &&
      el.textContent !== "Détection..." &&
      el.textContent !== "Detecting..."
    ) {
      return;
    }
    const key = el.getAttribute("data-i18n");
    el.textContent = getTranslation(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", getTranslation(key));
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    el.innerHTML = getTranslation(key);
  });

  if (!sendModal.classList.contains("hidden") && activeTargetId) {
    const activeClient = connectedClients.find((c) => c.id === activeTargetId);
    if (activeClient) {
      sendModalTitle.textContent = `${getTranslation("shareWith")} ${activeClient.name}`;
    }
  }

  localStorage.setItem("easy-share-lang", lang);
}

function detectLanguage() {
  const savedLang = localStorage.getItem("easy-share-lang");
  if (savedLang && i18n[savedLang]) {
    return savedLang;
  }
  const lang = (
    navigator.language ||
    navigator.userLanguage ||
    ""
  ).toLowerCase();
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("pt")) return "pt";
  return "en";
}

function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function connect() {
  clearTimeout(reconnectTimeout);
  updateStatus("connecting", "connecting");

  const wsUrl = getWebSocketUrl();
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    updateStatus("connected", "connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "init") {
        myClientId = data.clientId;
        serverUrl = data.serverUrl;

        if (data.qrCode) {
          desktopQrcodeImg.src = data.qrCode;
          desktopQrcodeImg.style.display = "block";
          desktopQrcodePlaceholder.style.display = "none";

          mobileQrcodeImg.src = data.qrCode;
          mobileQrcodeImg.style.display = "block";
          mobileQrcodePlaceholder.style.display = "none";
        }
      } else if (data.type === "clients_list") {
        connectedClients = data.clients;

        const me = connectedClients.find((c) => c.id === myClientId);
        if (me) {
          myDeviceName.textContent = me.name;
        }

        renderDevices();
      } else if (data.type === "new_message") {
        if (data.message.senderId !== myClientId) {
          showReceivedPopup(data.message);
        }
      }
    } catch (err) {
      console.error("Error parsing WS message:", err);
    }
  };

  socket.onclose = () => {
    updateStatus("disconnected", "disconnected");
    reconnectTimeout = setTimeout(connect, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    socket.close();
  };
}

function updateStatus(state, key) {
  statusIndicator.className = `status-indicator status-${state}`;
  statusText.setAttribute("data-i18n", key);
  statusText.textContent = getTranslation(key);
}

function renderDevices() {
  devicesContainer.innerHTML = "";

  const peerClients = connectedClients.filter((c) => c.id !== myClientId);

  if (peerClients.length === 0) {
    emptyState.classList.remove("hidden");
    devicesContainer.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  devicesContainer.classList.remove("hidden");

  peerClients.forEach((client) => {
    const bubble = document.createElement("div");
    bubble.className = "device-bubble";
    bubble.dataset.id = client.id;

    let deviceIconSvg = monitorSvg;
    if (/iphone|ipad/i.test(client.name)) deviceIconSvg = smartphoneSvg;
    else if (/android/i.test(client.name)) deviceIconSvg = smartphoneSvg;

    bubble.innerHTML = `
      <div class="bubble-node">${deviceIconSvg}</div>
      <span class="device-label">${escapeHTML(client.name)}</span>
    `;

    bubble.addEventListener("click", () => {
      openSendModal(client.id, client.name);
    });

    setupDragAndDropOnBubble(bubble, client.id);

    devicesContainer.appendChild(bubble);
  });
}

function setupDragAndDropOnBubble(bubbleElement, targetId) {
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false,
    );
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      () => {
        bubbleElement.classList.add("drag-over");
      },
      false,
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    bubbleElement.addEventListener(
      eventName,
      () => {
        bubbleElement.classList.remove("drag-over");
      },
      false,
    );
  });

  bubbleElement.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
      sendDroppedFile(file, targetId);
    }
  });
}

async function sendDroppedFile(file, targetId) {
  const bubble = document.querySelector(
    `.device-bubble[data-id="${targetId}"]`,
  );
  let label, originalText;
  if (bubble) {
    label = bubble.querySelector(".device-label");
    originalText = label.textContent;
    label.textContent = getTranslation("loading");
    label.style.color = "var(--warning-color)";
  }

  const fileId =
    "f_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

  try {
    const response = await fetch(
      `/upload/${fileId}?name=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      },
    );

    if (!response.ok) throw new Error("Upload failed");

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "share_file",
          targetId: targetId,
          text: "",
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          fileId: fileId,
        }),
      );

      if (label) {
        label.textContent = getTranslation("sendSuccess");
        label.style.color = "var(--success-color)";
        setTimeout(() => {
          label.textContent = originalText;
          label.style.color = "";
        }, 2000);
      }
    }
  } catch (err) {
    console.error(err);
    if (label) {
      label.textContent = "Error!";
      label.style.color = "var(--danger-color)";
      setTimeout(() => {
        label.textContent = originalText;
        label.style.color = "";
      }, 2000);
    }
  }
}

function openSendModal(targetId, targetName) {
  activeTargetId = targetId;
  sendModalTitle.textContent = `${getTranslation("shareWith")} ${targetName}`;

  textInput.value = "";
  clearFileSelection();

  sendModal.classList.remove("hidden");
  textInput.focus();
}

sendModalClose.addEventListener("click", () => {
  sendModal.classList.add("hidden");
});

async function sendModalPayload() {
  const text = textInput.value.trim();
  if (!text && !selectedFile) return;

  if (socket && socket.readyState === WebSocket.OPEN) {
    if (selectedFile) {
      const originalBtnText = sendBtn.textContent;
      sendBtn.disabled = true;
      sendBtn.textContent = getTranslation("loading");

      const fileId =
        "f_" +
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 5);

      try {
        const response = await fetch(
          `/upload/${fileId}?name=${encodeURIComponent(selectedFile.name)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": selectedFile.type || "application/octet-stream",
            },
            body: selectedFile,
          },
        );

        if (!response.ok) throw new Error("Upload failed");

        socket.send(
          JSON.stringify({
            type: "share_file",
            targetId: activeTargetId,
            text: text,
            fileName: selectedFile.name,
            fileType: selectedFile.type || "application/octet-stream",
            fileSize: selectedFile.size,
            fileId: fileId,
          }),
        );
      } catch (err) {
        console.error(err);
        alert("Erreur lors du transfert du fichier.");
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = originalBtnText;
      }
    } else {
      socket.send(
        JSON.stringify({
          type: "share_text",
          targetId: activeTargetId,
          text: text,
        }),
      );
    }

    sendModal.classList.add("hidden");
  }
}

function updateSendBtnState() {
  const isConnected = socket && socket.readyState === WebSocket.OPEN;
  const hasContent = textInput.value.trim().length > 0 || selectedFile !== null;
  sendBtn.disabled = !isConnected || !hasContent;
}

textInput.addEventListener("input", updateSendBtnState);
sendBtn.addEventListener("click", sendModalPayload);

textInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    sendModalPayload();
  }
});

modalDropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleModalSelectedFile(file);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  modalDropZone.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      modalDropZone.classList.add("drag-over");
    },
    false,
  );
});

["dragleave", "drop"].forEach((eventName) => {
  modalDropZone.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      modalDropZone.classList.remove("drag-over");
    },
    false,
  );
});

modalDropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    handleModalSelectedFile(file);
  }
});

function handleModalSelectedFile(file) {
  selectedFile = file;
  fileNameText.textContent = file.name;
  selectedFileBadge.classList.remove("hidden");
  updateSendBtnState();
}

cancelFileBtn.addEventListener("click", clearFileSelection);

function clearFileSelection() {
  selectedFile = null;
  fileInput.value = "";
  selectedFileBadge.classList.add("hidden");
  updateSendBtnState();
}

function showReceivedPopup(message) {
  receivedModalTitle.textContent = getTranslation("newShare");
  receivedModalBody.innerHTML = "";

  if (message.type === "file") {
    const fileDownloadUrl = `/download/${message.fileId}`;
    const sizeStr = formatBytes(message.fileSize);

    if (message.fileType.startsWith("image/")) {
      receivedModalBody.innerHTML = `
        ${message.text ? `<p style="margin-bottom: 0.75rem; font-size: 0.95rem;">${escapeHTML(message.text)}</p>` : ""}
        <img src="${fileDownloadUrl}" class="received-image-preview" alt="Image" onclick="window.open('${fileDownloadUrl}')" />
        <div class="received-actions">
          <a class="action-btn-small" href="${fileDownloadUrl}" download="${escapeHTML(message.fileName)}" target="_blank">${getTranslation("saveImage")}</a>
        </div>
      `;
    } else {
      receivedModalBody.innerHTML = `
        ${message.text ? `<p style="margin-bottom: 0.75rem; font-size: 0.95rem;">${escapeHTML(message.text)}</p>` : ""}
        <div class="received-file-card">
          <div class="received-file-icon">${fileSvg}</div>
          <div class="received-file-info">
            <span class="received-file-name" title="${escapeHTML(message.fileName)}">${escapeHTML(message.fileName)}</span>
            <span class="received-file-size">${sizeStr}</span>
          </div>
        </div>
        <div class="received-actions">
          <a class="action-btn-small" href="${fileDownloadUrl}" download="${escapeHTML(message.fileName)}" target="_blank">${getTranslation("download")}</a>
        </div>
      `;
    }
  } else {
    receivedModalBody.innerHTML = `
      <div class="received-text-body">${escapeHTML(message.text)}</div>
      <div class="received-actions">
        <button class="action-btn-small copy-btn" id="popup-copy-btn">${getTranslation("copyText")}</button>
      </div>
    `;

    const popupCopyBtn = receivedModalBody.querySelector("#popup-copy-btn");
    popupCopyBtn.addEventListener("click", () => {
      copyTextToClipboard(message.text, popupCopyBtn);
    });
  }

  receivedModal.classList.remove("hidden");
}

receivedModalClose.addEventListener("click", () => {
  receivedModal.classList.add("hidden");
});
receivedCloseBtn.addEventListener("click", () => {
  receivedModal.classList.add("hidden");
});

burgerMenuBtn.addEventListener("click", () => {
  mobileQrModal.classList.remove("hidden");
});

const openLargeQr = () => {
  mobileQrModal.classList.remove("hidden");
};

desktopQrcodeImg.addEventListener("click", openLargeQr);
desktopQrcodePlaceholder.addEventListener("click", openLargeQr);

mobileQrClose.addEventListener("click", () => {
  mobileQrModal.classList.add("hidden");
});

[sendModal, receivedModal, mobileQrModal, aboutModal, troubleModal].forEach(
  (modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  },
);

aboutTriggerBtn.addEventListener("click", () => {
  aboutModal.classList.remove("hidden");
});

aboutModalClose.addEventListener("click", () => {
  aboutModal.classList.add("hidden");
});

aboutCloseBtn.addEventListener("click", () => {
  aboutModal.classList.add("hidden");
});

const openTroubleModal = () => {
  troubleModal.classList.remove("hidden");
};

desktopTroubleBtn.addEventListener("click", openTroubleModal);
mobileTroubleBtn.addEventListener("click", openTroubleModal);

troubleModalClose.addEventListener("click", () => {
  troubleModal.classList.add("hidden");
});

troubleCloseBtn.addEventListener("click", () => {
  troubleModal.classList.add("hidden");
});

desktopCopyBtn.addEventListener("click", () => {
  copyTextToClipboard(serverUrl, desktopCopyBtn);
});

mobileCopyBtn.addEventListener("click", () => {
  copyTextToClipboard(serverUrl, mobileCopyBtn);
});

function copyTextToClipboard(text, buttonElement) {
  if (!navigator.clipboard) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      setCopyFeedback(buttonElement);
    } catch (err) {
      console.error(err);
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      setCopyFeedback(buttonElement);
    })
    .catch((err) => {
      console.error(err);
    });
}

function setCopyFeedback(btn) {
  if (btn.classList.contains("copy-link-btn")) {
    const span = btn.querySelector("span");
    const originalHtml = btn.innerHTML;
    if (span) span.textContent = getTranslation("linkCopied");
    btn.classList.add("copied");
    setTimeout(() => {
      btn.classList.remove("copied");
      if (span) span.textContent = getTranslation("copyLink");
    }, 1800);
  } else if (btn.classList.contains("icon-btn-small")) {
    btn.classList.add("copied");
    btn.innerHTML = checkSvg;
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.innerHTML = copySvg;
    }, 1500);
  } else {
    const originalText = btn.textContent;
    btn.textContent = getTranslation("copiedFeedback");
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("copied");
    }, 1800);
  }
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return "0 Octet";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}

langDropdownTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle("open");
  langDropdownTrigger.setAttribute(
    "aria-expanded",
    langDropdown.classList.contains("open"),
  );
});

langOptions.forEach((opt) => {
  opt.addEventListener("click", () => {
    applyLanguage(opt.dataset.lang);
    langDropdown.classList.remove("open");
    langDropdownTrigger.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", () => {
  langDropdown.classList.remove("open");
  langDropdownTrigger.setAttribute("aria-expanded", "false");
});

const detectedLang = detectLanguage();
applyLanguage(detectedLang);

connect();

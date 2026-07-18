const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const projectPath = __dirname;
const desktopPath = path.join(os.homedir(), "Desktop");

console.log("Installing Easy-Share...");

try {
  console.log("Linking global CLI command (easy-share)...");
  execSync('pnpm add -g .', { stdio: 'inherit', cwd: projectPath });
  console.log("✓ CLI command successfully registered.");
} catch (err) {
  console.log("\n⚠️  Could not register global CLI command.");
  console.log(
    "Reason: The global pnpm bin directory is not in your system PATH.",
  );
  console.log("To fix this, please run:");
  console.log("  pnpm setup");
  console.log(
    'Then, close and restart your terminal, and run "node install.js" again.\n',
  );
}

if (!fs.existsSync(desktopPath)) {
  console.log("Could not find Desktop folder. Skipping shortcut creation.");
  process.exit(0);
}

try {
  const platform = os.platform();

  if (platform === 'win32') {
    const batPath = path.join(projectPath, 'Easy-Share.bat');
    const batContent = `@echo off\r\ncd /d "${projectPath}"\r\nstart http://localhost:3000\r\npnpm start\r\n`;
    fs.writeFileSync(batPath, batContent, 'utf8');

    const icoPath = path.join(projectPath, 'public', 'icon.ico');

    const lnkPath = path.join(desktopPath, 'Easy-Share.lnk');
    const createLnkScript = `
      $WshShell = New-Object -ComObject WScript.Shell;
      $Shortcut = $WshShell.CreateShortcut('${lnkPath}');
      $Shortcut.TargetPath = '${batPath}';
      $Shortcut.WorkingDirectory = '${projectPath}';
      if (Test-Path '${icoPath}') {
        $Shortcut.IconLocation = '${icoPath}';
      }
      $Shortcut.Save();
    `;
    
    try {
      execSync(`powershell -Command "${createLnkScript.replace(/\n/g, ' ')}"`, { stdio: 'ignore' });
      const oldBatDesktop = path.join(desktopPath, 'Easy-Share.bat');
      if (fs.existsSync(oldBatDesktop)) {
        fs.unlinkSync(oldBatDesktop);
      }
      console.log(`✓ Desktop shortcut created at: ${lnkPath}`);
    } catch (lnkErr) {
      const shortcutPath = path.join(desktopPath, 'Easy-Share.bat');
      fs.writeFileSync(shortcutPath, batContent, 'utf8');
      console.log(`✓ Desktop shortcut created (fallback .bat) at: ${shortcutPath}`);
    }
  } else if (platform === "darwin") {
    const shortcutPath = path.join(desktopPath, "Easy-Share.command");
    const content = `#!/bin/bash\ncd "${projectPath}"\nopen http://localhost:3000\npnpm start\n`;
    fs.writeFileSync(shortcutPath, content, "utf8");
    fs.chmodSync(shortcutPath, "755");
    console.log(`✓ Desktop shortcut created at: ${shortcutPath}`);
  } else if (platform === "linux") {
    const shortcutPath = path.join(desktopPath, "Easy-Share.desktop");
    const content = `[Desktop Entry]\nVersion=1.0\nType=Application\nName=Easy-Share\nComment=Local network sharing utility\nExec=bash -c 'cd "${projectPath}" && xdg-open http://localhost:3000 && pnpm start'\nIcon=${path.join(projectPath, "public", "icon.png")}\nTerminal=true\nCategories=Utility;\n`;
    fs.writeFileSync(shortcutPath, content, "utf8");
    fs.chmodSync(shortcutPath, "755");
    console.log(`✓ Desktop shortcut created at: ${shortcutPath}`);
  }
} catch (err) {
  console.error("Failed to create Desktop shortcut:", err);
}

console.log("\nEasy-Share setup completed!");
console.log(
  "You can now start the server by typing: easy-share in any terminal.",
);

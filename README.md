<div align="center">
  <img src="public/icon.png" alt="Easy-Share Logo" width="128" style="border-radius: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);"/>
  <br />
  <br />
  <h1>Easy-Share</h1>
  <p><strong>Open-source, fast, and universal alternative to AirDrop.</strong></p>
</div>

---

**Easy-Share** is a desktop application and lightweight web service designed to instantly share files and text between all your devices (PC, Mac, iPhone, Android, tablets).

Unlike AirDrop, which is locked to the Apple ecosystem, Easy-Share should work everywhere. The app creates a local bridge over your Wi-Fi network, which means that no data is sent to the cloud or goes through the Internet. That makes it a **fast, secure, and private** solution for sharing files and text between devices.

![Easy-Share Interface](.github/images/easy-share-main.png)

---

## Quick Start & Installation

### For End Users

To install Easy-Share as a native application on your desktop:

1. Head over to the **[Releases](https://github.com/Axthauvin/easy-share/releases)** tab of this GitHub repository.
2. Download the installer matching your operating system:
   - **Windows**: The `.exe` file (classic NSIS installer with setup wizard, directory selection, and desktop shortcut option).
   - **macOS**: The `.dmg` or `.zip` file.
   - **Linux**: The `.deb` package or `.AppImage` file.
3. Launch the application. It will automatically start the local server and open a clean window.
4. To connect another device (like a smartphone), simply scan the QR code displayed on the screen while connected to the same Wi-Fi network, it will open the Easy-Share web interface in your mobile browser.

---

## 🛠️ Development & Compilation

If you want to modify the code or build the installer yourself:

### Install dependencies

```bash
pnpm install # or npm install
```

### Run in development mode

To start the Electron desktop app locally:

```bash
pnpm electron # or npm run electron
```

### Compile & build installers

To package and generate native installers (NSIS, DMG, DEB) for your current platform:

```bash
pnpm run build # or npm run build
```

You will find the generated distribution files in the `/dist` directory.

---

## Supported Languages

The application should automatically detect your system language and currently supports:
_English, French, Spanish, German, Italian and Portuguese._

To contribute and add a new language, simply add a translation file in the `public/translations` directory.

## Contributing

Contributions are welcome! If you want to contribute to the project, do not hesitate to fork the repository, make your changes, and submit a pull request. Please ensure that your code adheres to the existing style and conventions.

<div align="center">
  <br />
  <p>Made with ❤️ by <a href="https://github.com/axthauvin">axthauvin</a>
</div>

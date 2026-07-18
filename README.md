# Easy-Share

A minimalist, local network file and text sharing utility. Allows quick transfers between devices (PCs, phones, tablets) connected to the same Wi-Fi network.

## Running the Project

1. Install dependencies:

   ```bash
   pnpm install # or npm install
   ```

2. Start the local server:

   ```bash
   pnpm start # or npm start
   ```

3. Connect your devices:
   - On desktop, scan the QR code displayed in the top-right corner.
   - On mobile, tap the burger menu to show the QR code.

![Demo image](.github/images/easy-share.png)

## Install globally on youyr system

To register the `easy-share` command globally and create a launcher shortcut directly on your desktop, run:

```bash
node install.js
```

After running the setup:

- **Desktop Shortcut**: Double-click the **Easy-Share** icon on your Desktop to start the server and open the web page automatically.
- **Global Command**: Type `easy-share` in any terminal window to start the server.

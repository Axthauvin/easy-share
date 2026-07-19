const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the existing Express/WebSocket server
require('./server.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    icon: path.join(__dirname, 'public', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f5f5f7',
      symbolColor: '#1d1d1f',
      height: 36
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the local server URL
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

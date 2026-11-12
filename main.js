const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');

app.commandLine.appendSwitch('ignore-gpu-blocklist');

function create() {
  Menu.setApplicationMenu(null);

  const w = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#000',
    autoHideMenuBar: true,
    title: 'SECTOR 7',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  w.loadFile(path.join(__dirname, 'index.html'));

  w.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && i.key === 'F11') {
      w.setFullScreen(!w.isFullScreen());
    }

    // Temporary diagnostics: open Chromium DevTools with Ctrl+Shift+I.
    if (i.type === 'keyDown' && i.control && i.shift && i.key.toLowerCase() === 'i') {
      w.webContents.openDevTools({ mode: 'detach' });
    }
  });
}

ipcMain.on('sector7:quit', event => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) app.quit();
});

app.whenReady().then(create);

app.on('window-all-closed', () => app.quit());

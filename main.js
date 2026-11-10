const { app, BrowserWindow, Menu } = require('electron');

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
      webSecurity: true
    }
  });

  w.loadFile('index.html');

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

app.whenReady().then(create);

app.on('window-all-closed', () => app.quit());

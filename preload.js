'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sector7Desktop', Object.freeze({
  quit: () => ipcRenderer.send('sector7:quit')
}));

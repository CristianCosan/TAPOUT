// Bridge between the game and the desktop shell. File saves and settings land here in M13.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('tapoutDesktop', { platform: process.platform });

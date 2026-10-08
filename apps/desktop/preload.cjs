// Bridge between the game and the desktop shell: the save store, one JSON file per key.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tapoutDesktop', {
  platform: process.platform,
  store: {
    get: (key) => ipcRenderer.sendSync('store:get', key),
    set: (key, value) => ipcRenderer.sendSync('store:set', key, value),
    remove: (key) => ipcRenderer.sendSync('store:remove', key),
    openFolder: () => ipcRenderer.sendSync('store:openFolder'),
  },
});

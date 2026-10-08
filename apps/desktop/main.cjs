// Electron main process: one window showing the 1920x1080 stage.
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('node:path');
const { createStore } = require('./store.cjs');

// ---- saves: the game's store, one JSON file per key (store.cjs)
let store = null;
const saves = () => (store ??= createStore(app.getPath('userData')));

ipcMain.on('store:get', (event, key) => {
  event.returnValue = saves().get(key);
});
ipcMain.on('store:set', (event, key, value) => {
  event.returnValue = saves().set(key, value);
});
ipcMain.on('store:remove', (event, key) => {
  event.returnValue = saves().remove(key);
});
ipcMain.on('store:openFolder', (event) => {
  shell.openPath(app.getPath('userData'));
  event.returnValue = true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#000000',
    title: 'TAP / OUT',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  Menu.setApplicationMenu(null);
  const devUrl = process.env.TAPOUT_DEV_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

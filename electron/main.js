const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { setupModuleHandlers } = require('./handlers/module-handler')
const { setupThresholdHandlers } = require('./handlers/threshold-handler');
const { setupEvaluationHandlers } = require('./handlers/evaluation-handler');
const { setupCSVHandlers, setupExcelHandler, setupPdfHandler} = require('./handlers/export-handler')
const path = require('path');




function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
  });

  win.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser', 'index.html'));

 // win.webContents.openDevTools();
}



app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

setupModuleHandlers();
setupThresholdHandlers();
setupEvaluationHandlers();
setupCSVHandlers();
setupExcelHandler();
setupPdfHandler();






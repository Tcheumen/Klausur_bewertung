const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const thresholdPath = path.join(__dirname, '../../data/thresholds.json');

function setupThresholdHandlers() {
  ipcMain.on('load-thresholds', (event) => {
    fs.readFile(thresholdPath, 'utf-8', (err, data) => {
      if (err) {
        event.sender.send('thresholds-loaded', []);
      } else {
        try {
          const parsed = JSON.parse(data);
          event.sender.send('thresholds-loaded', parsed);
        } catch {
          event.sender.send('thresholds-loaded', []);
        }
      }
    });
  });

  ipcMain.on('save-thresholds', (event, data) => {
    fs.writeFile(thresholdPath, JSON.stringify(data, null, 2), (err) => {
      if (!err) {
        event.sender.send('thresholds-saved');
      }
    });
  });
}

module.exports = { setupThresholdHandlers };

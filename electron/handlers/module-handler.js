const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');


const dataPath = path.join(__dirname, '../../data/module-info.json');

function setupModuleHandlers() {
  ipcMain.on('save-module-info', (event, data) => {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(dataPath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('❌ Fehler beim Speichern:', err);
      } else {
        console.log('✅ Modul gespeichert unter:', dataPath);
        event.sender.send('module-save-success');
      }
    });
  });

  ipcMain.on('load-module-info', (event) => {
    fs.readFile(dataPath, 'utf-8', (err, data) => {
      if (err) {
        console.log('ℹ️ Keine Datei gefunden, Rückgabe eines leeren Moduls');
        event.sender.send('module-info-loaded', {
          moduleTitle: '',
          moduleNumber: '',
          examDate: '',
          examiners: []
        });
      } else {
        try {
          const parsed = JSON.parse(data);
          event.sender.send('module-info-loaded', parsed);
        } catch (parseError) {
          console.error('❌ Fehler beim Parsen:', parseError);
          event.sender.send('module-info-loaded', {
            moduleTitle: '',
            moduleNumber: '',
            examDate: '',
            examiners: []
          });
        }
      }
    });
  });
}

module.exports = { setupModuleHandlers };

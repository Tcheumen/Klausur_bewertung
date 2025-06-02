const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const evalPath = path.join(dataDir, 'evaluation-data.json');

function setupEvaluationHandlers() {
  // Écouter la sauvegarde
  ipcMain.on('save-evaluation-data', (event, payload) => {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFile(evalPath, JSON.stringify(payload, null, 2), 'utf-8', (err) => {
        if (err) {
          console.error('❌ Fehler beim Speichern:', err);
          event.sender.send('evaluation-save-error', err.message);
        } else {
          console.log('✅ Evaluation gespeichert.');
          event.sender.send('evaluation-saved');
        }
      });
    } catch (err) {
      console.error('❌ Fehler beim Verzeichnis:', err);
      event.sender.send('evaluation-save-error', err.message);
    }
  });

  // Écouter le chargement
  ipcMain.on('load-evaluation-data', (event) => {
    if (!fs.existsSync(evalPath)) {
      console.warn('📂 Noch keine Datei vorhanden. Sende leere Daten.');
      event.sender.send('evaluation-loaded', { students: [], exercises: [], moduleInfo: {} });
      return;
    }

    fs.readFile(evalPath, 'utf-8', (err, data) => {
      if (err) {
        console.error('❌ Fehler beim Lesen:', err);
        event.sender.send('evaluation-load-error', err.message);
      } else {
        try {
          const json = JSON.parse(data);
          event.sender.send('evaluation-loaded', json);
        } catch (parseErr) {
          console.error('❌ JSON Parse Fehler:', parseErr);
          event.sender.send('evaluation-load-error', 'Ungültiges JSON Format');
        }
      }
    });
  });
}

module.exports = { setupEvaluationHandlers };

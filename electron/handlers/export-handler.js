// handlers/export-handler.js
const { ipcMain } = require('electron');
const { exportCSV } = require('../services/csvService');
const { generateExcelBuffer } = require('../services/excelService');
const { generatePDFReport } = require('../services/pdfService');
const fs = require('fs');
const path = require('path');

function setupCSVHandlers() {
  ipcMain.on('export-csv', async (event) => {
    try {
      console.log('📥 Export CSV demandé');
      const csv = exportCSV();

      // 🔹 Mode E2E : écrire le CSV sur le disque si E2E_CSV_PATH est défini
      const e2eCsvPath = process.env.E2E_CSV_PATH;
      if (e2eCsvPath) {
        const dir = path.dirname(e2eCsvPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(e2eCsvPath, csv, { encoding: 'latin1' });
        console.log(`✅ CSV écrit pour les tests E2E: ${e2eCsvPath}`);
      }

      // Comportement normal : renvoyer le contenu au frontend
      event.sender.send('export-csv-success', csv);
    } catch (err) {
      console.error('❌ Fehler beim Export:', err);
      event.sender.send(
        'export-csv-error',
        err.message || 'Unbekannter Fehler',
      );
    }
  });
}

function setupExcelHandler() {
  ipcMain.on('export-excel', async (event) => {
    try {
      console.log('📥 export-excel reçu dans main.js');
      const buffer = generateExcelBuffer();
      const base64 = buffer.toString('base64');
      event.sender.send('export-excel-success', base64);
    } catch (err) {
      console.error('❌ Fehler beim Excel-Export:', err);
      event.sender.send('export-excel-error', err.message || 'Unbekannter Fehler');
    }
  });
}

function setupPdfHandler() {
  ipcMain.on('export-pdf', async (event) => {
    try {
      console.log('📥 export-pdf reçu dans main.js');

      const buffer = await generatePDFReport();

      // 🔹 Mode E2E : écrire le PDF sur le disque si E2E_PDF_PATH est défini
      const e2ePath = process.env.E2E_PDF_PATH;
      if (e2ePath) {
        const dir = path.dirname(e2ePath);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(e2ePath, buffer);
        console.log(`✅ PDF écrit pour les tests E2E: ${e2ePath}`);
      }

      // 🔹 Comportement normal : envoyer le PDF en base64 au frontend
      const base64 = buffer.toString('base64');
      event.sender.send('export-pdf-success', base64);
    } catch (err) {
      console.error('❌ Fehler beim PDF-Export:', err);
      event.sender.send('export-pdf-error', err.message || 'Unbekannter Fehler');
    }
  });
}

module.exports = { setupCSVHandlers, setupExcelHandler, setupPdfHandler };

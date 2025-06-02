const { ipcMain } = require('electron');
const { exportCSV } = require('../services/csvService');
const { generateExcelBuffer } = require('../services/excelService')
const { generatePDFReport } = require('../services/pdfService')

function setupCSVHandlers() {
  ipcMain.on('export-csv', async (event) => {
    try {
      console.log('📥 Export CSV demandé');
      const csv = exportCSV();
      event.sender.send('export-csv-success', csv);
    } catch (err) {
      console.error('❌ Fehler beim Export:', err);
      event.sender.send('export-csv-error', err.message || 'Unbekannter Fehler');
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
    const buffer = await generatePDFReport();
    const base64 = buffer.toString('base64');
    event.sender.send('export-pdf-success', base64);
  } catch (err) {
    console.error('❌ Fehler beim PDF-Export:', err);
    event.sender.send('export-pdf-error', err.message || 'Unbekannter Fehler');
  }
});
}

module.exports = { setupCSVHandlers, setupExcelHandler, setupPdfHandler};
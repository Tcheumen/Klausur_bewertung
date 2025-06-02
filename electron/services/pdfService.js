const { PassThrough } = require('stream');
const PDFDocument = require('pdfkit');
const fs = require('fs');
//const path = require('path');
const { generateChart, generatePassChart, generateRadarChart } = require('../utils/chartGenerator');
const { getProcessedData } = require('../utils/studentsStatistics');
const { drawTable } = require('../utils/tableDrawer');



const centerText = (doc, text) => {
    const pageWidth = doc.page.width;
    const textWidth = doc.widthOfString(text);
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(text, xPosition, doc.y, { underline: true });
};

const ensureNewPage = (doc, spaceNeeded) => {
    if (doc.y + spaceNeeded > doc.page.height - 50) {
        doc.addPage();
    }
};


const generatePDFReport = async () => {
  const { students, thresholds, weightingOfExercice, moduleInfo, successRate, failureRate, exerciseLabels, exerciseData, avgPercentages } = getProcessedData();

  const chartBuffer = await generateChart();
  const passChartBuffer = await generatePassChart();
  const radarChartBuffer = await generateRadarChart(exerciseLabels, exerciseData, 'Durchschnittliche Prozentsätze pro Übung');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = new PassThrough();
  const chunks = [];

  doc.pipe(stream);

  stream.on('data', chunk => chunks.push(chunk));

  // Titre principal
    doc.font('Helvetica-Bold').fontSize(14).text("Prüfungsbewertungsbericht", { align: 'center' });
    doc.moveDown(1);

    // Informations sur le module
    doc.fontSize(10);
    const moduleData = [
        { label: "Modultitel", value: moduleInfo.moduleTitle },
        { label: "Modulnummer", value: moduleInfo.moduleNumber },
        { label: "Prüfungsdatum", value: moduleInfo.examDate },
        { label: "Prüfer", value: moduleInfo.examiners.join(', ') },
        { label: "Exportsdatum", value: new Date().toLocaleDateString() }
    ];

    moduleData.forEach(({ label, value }) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
    });

    doc.moveDown(2);

    // Notenverteilung
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Verteilung der Noten und Prozentsätze");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    drawTable(doc, ['Punkte', 'Prozentsatz', 'Note'], thresholds.map(t => [t.points, `${t.percentage}%`, t.note.toString().replace('.', ',')]), doc.y);
    doc.moveDown(4);

    // Gewichtung der Übungen
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Gewichtung der Übungen");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    drawTable(doc, ['Übung', 'Gewichtung'], Object.entries(weightingOfExercice).map(([ex, wt]) => [ex, wt]), doc.y);
    doc.moveDown(4);

    // Teilnehmerdaten
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Teilnehmerdaten");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    drawTable(doc, ['Matrikelnummer', 'Name', 'Gesamtpunkte', 'Bewertung'], 
    students
        .sort((a, b) => a.nachname.localeCompare(b.nachname)) // Tri par nom de famille
        .map(s => [s.mtknr, `${s.nachname}, ${s.vorname}`, (s.total ? s.total.toString().replace('.', ',') : 'ne'), s.bewertung || 'ne']), 
    doc.y);

    doc.moveDown(4);

    // Notenverteilung
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Notenverteilung");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    doc.image(chartBuffer, 72, doc.y, { width: 450 });
    doc.moveDown(26);

    // Erfolgs- und Misserfolgsrate
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Erfolgs- und Misserfolgsrate");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    doc.font('Helvetica-Bold').text("Erfolgsrate: ", { continued: true }).font('Helvetica').text(`${successRate.toFixed(2)}%`);
    doc.font('Helvetica-Bold').text("Misserfolgsrate: ", { continued: true }).font('Helvetica').text(`${failureRate.toFixed(2)}%`);
    doc.moveDown(1);
    doc.image(passChartBuffer, 150, doc.y, { width: 300 });
    doc.moveDown(20);

    // Durchschnittliche Prozentsätze pro Übung
    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Durchschnittliche Prozentsätze pro Übung");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    doc.image(radarChartBuffer, 72, doc.y, { width: 450 });
    doc.moveDown(20);

    doc.fontSize(12);
    ensureNewPage(doc, 250);
    centerText(doc, "Durchschnittswerte pro Übung");
    doc.moveDown(1);
    if (doc.y + 250 > doc.page.height - 50) doc.addPage();
    drawTable(doc, ['Übungen', 'Durchschnitt (%)'], Object.entries(avgPercentages).map(([exercise, average]) => [exercise, average.toFixed(2).toString().replace('.', ',') + "%"]), doc.y);


  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    stream.on('error', reject);
  });
};

module.exports = { generatePDFReport };

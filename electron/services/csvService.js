const fs = require('fs');
const path = require('path');

const EVALUATION_DATA_PATH = path.resolve('data', 'evaluation-data.json');

const MODULE_INFO_PATH = path.resolve('data', 'module-info.json');


const exportCSV = () => {
  if (!fs.existsSync(EVALUATION_DATA_PATH)) {
    throw new Error('Keine gespeicherten Evaluationsdaten gefunden');
  }

  if (!fs.existsSync(MODULE_INFO_PATH)) {
    throw new Error('Keine gespeicherten Modulinfos gefunden');
  }

  const rawData = fs.readFileSync(EVALUATION_DATA_PATH, 'utf8');
  const moduleInfoRaw = fs.readFileSync(MODULE_INFO_PATH, 'utf8');

  const { students, tasks } = JSON.parse(rawData);
  const moduleInfo = JSON.parse(moduleInfoRaw);

  const taskList = Array.isArray(tasks) ? tasks : [];

  const fields = [
    'MatrikelNr',
    'Nachname',
    'Vorname',
    'Pversuch',
    'Pvermerk',
    'Sitzplatz',
    ...taskList,
    'Gesamt',
    'Bewertung',
    'Note'
  ];

  const rows = students.map(student => {
    const row = {
      MatrikelNr: student.mtknr || '',
      Nachname: student.nachname || '',
      Vorname: student.vorname || '',
      Pversuch: student.pversuch || '',
      Pvermerk: student.pvermerk || '',
      Sitzplatz: student.sitzplatz || '',
    };

    taskList.forEach(task => {
      row[task] = student.scores?.[task] ?? '';
    });

    row['Gesamt'] = student.total ?? '';
    row['Bewertung'] = student.bewertung ?? '';
    row['Note'] = student.note ?? '';

    return row;
  });

  const header = fields.join(';');
  const body = rows.map(r => fields.map(f => r[f]).join(';')).join('\n');

  const moduleInfoBlock = `Module Title;Module Number;Prüfungsdatum;Prüfer;Exportdatum\n` +
    `${moduleInfo.moduleTitle};${moduleInfo.moduleNumber};${moduleInfo.examDate};${moduleInfo.examiners.join(', ')};${new Date().toLocaleDateString()}\n`;

  return `\uFEFF${moduleInfoBlock}\n${header}\n${body}`;
};

module.exports = { exportCSV };

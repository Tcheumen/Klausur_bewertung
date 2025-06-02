const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// chemins
const EVALUATION_PATH = path.resolve('data', 'evaluation-data.json');
const MODULE_INFO_PATH = path.resolve('data', 'module-info.json');
const THRESHOLD_PATH = path.resolve('data', 'thresholds.json');

const generateExcelBuffer = () => {
    // vérifications
    if (!fs.existsSync(EVALUATION_PATH)) throw new Error('evaluation-data.json manquant');
    if (!fs.existsSync(MODULE_INFO_PATH)) throw new Error('module-info.json manquant');
    if (!fs.existsSync(THRESHOLD_PATH)) throw new Error('thresholds.json manquant');

    const evalRaw = fs.readFileSync(EVALUATION_PATH, 'utf8');
    const moduleRaw = fs.readFileSync(MODULE_INFO_PATH, 'utf8');
    const thresholdRaw = fs.readFileSync(THRESHOLD_PATH, 'utf8');

    const { students, taskWeights = {} } = JSON.parse(evalRaw);
    const moduleInfo = JSON.parse(moduleRaw);
    const thresholds = JSON.parse(thresholdRaw);

    const workbook = xlsx.utils.book_new();

    // 🧑‍🎓 Étudiants
    const studentData = students.map(student => ({
        Mtknr: student.mtknr,
        Nachname: student.nachname,
        Vorname: student.vorname,
        ...student.scores,
        Gesamt: student.total || String('ne').padStart(21, ' '),
        Bewertung: student.bewertung || String('ne').padStart(21, ' '),
        
    }));

    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(studentData), 'Students');

    // 🧮 Pondération des tâches
    const exerciseData = Object.entries(taskWeights).map(([task, weight]) => ({
        Aufgabe: task,
        Punktzahl: weight
    }));
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(exerciseData), 'Aufgaben');

    // 🎯 Seuils
    const thresholdData = thresholds.map(th => ({
        Punkte: th.points,
        Prozentsatz: `${th.percentage}%`,
        Note: th.note
    }));
    xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(thresholdData), 'Grenzwerte');

    // 📋 Infos du module
    const moduleInfoData = [
        { "Module Eigenschaft": "Module Title", "Module Information": moduleInfo.moduleTitle },
        { "Module Eigenschaft": "Module Number", "Module Information": moduleInfo.moduleNumber },
        { "Module Eigenschaft": "Prüfungsdatum", "Module Information": moduleInfo.examDate },
        { "Module Eigenschaft": "Prüfer", "Module Information": moduleInfo.examiners.join(', ') },
        { "Module Eigenschaft": "Exportdatum", "Module Information": new Date().toLocaleDateString() }
    ];
    const moduleInfoSheet = xlsx.utils.json_to_sheet(moduleInfoData);
    moduleInfoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }];
    xlsx.utils.book_append_sheet(workbook, moduleInfoSheet, 'Module Info');

    // 🔁 Retourne un buffer
    return xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

module.exports = {
    generateExcelBuffer,
};

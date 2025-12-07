import { test, expect } from '../fixtures/electronApp.fixture';
import { HomePage } from '../pages/home.page';
import { ModulesPage } from '../pages/modules.page';
import { ThresholdsPage } from '../pages/thresholds.page';
import { ExamManagementPage } from '../pages/exam-management.page';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Parsed die CSV-Datei ecampus_export.csv, um die Basisdaten
 * der Studierenden zu übernehmen (ohne die Aufgaben-Noten, die aus der UI kommen).
 */
function parseEcampusCsv(csvPath: string) {
    const raw = readFileSync(csvPath, { encoding: 'latin1' });
    const lines = raw.trim().split('\n');

    // 1ère ligne = header
    const dataLines = lines.slice(1);

    return dataLines
        .filter(line => line.trim().length > 0)
        .map(line => {
            const [
                mtknr,
                nachname,
                vorname,
                pversuch,
                pvermerk,
                sitzplatz,
                bewertung,
            ] = line.split(';');

            return {
                mtknr: mtknr?.trim() ?? '',
                nachname: nachname?.trim() ?? '',
                vorname: vorname?.trim() ?? '',
                pversuch: pversuch?.trim() ?? '',
                pvermerk: pvermerk?.trim() ?? '',
                sitzplatz: sitzplatz?.trim() ?? '',
                bewertung: bewertung?.trim() ?? '',
            };
        });
}

test.describe('Exam Management - CSV + Aufgaben + Speicherung', () => {
    test('importiert eine CSV, fügt 4 Aufgaben hinzu und speichert die Konfigurationsdaten', async ({ window }) => {
        const home = new HomePage(window);
        const modules = new ModulesPage(window);
        const thresholds = new ThresholdsPage(window);
        const examPage = new ExamManagementPage(window);

        // 1. Home -> Module
        await home.goToModules();
        await modules.fillModuleForm();
        await modules.saveButton.click();
        await expect(modules.successMessage).toBeVisible();

        // 2. Module -> Threshold
        await modules.nextButton.click();
        await expect(thresholds.titleAdd).toBeVisible();

        await thresholds.waitForLoaded();
        await thresholds.saveThresholds();
        await expect(thresholds.saveMessage).toBeVisible();

        // 3. Threshold -> Upload (Exam Management)
        await thresholds.nextButton.click();
        await expect(examPage.titleUpload).toBeVisible();
        await expect(examPage.studentsTitle).toBeVisible();

        // 4. Test-CSV vorbereiten
        const testDataDir = join(__dirname, '..', 'data_test');
        mkdirSync(testDataDir, { recursive: true });

        const csvPath = join(testDataDir, 'ecampus_export.csv');
        const csvContent = [
            'mtknr;nachname;vorname;pversuch;pvermerk;Sitzplatz;bewertung',
            '5923847;Müller;Max;1;;;',
            '5762983;Schmidt;Paul;1;;;2',
            '5847123;Schneider;Alexander;1;;;',
            '5983746;Fischer;Lukas;1;;;',
            '5938174;Weber;Leon;1;;;',
            '5792834;Meyer;Jonas;1;;;',
        ].join('\n');

        writeFileSync(csvPath, csvContent, { encoding: 'latin1' });

        // 5. Import CSV
        await examPage.uploadCsv(csvPath);
        await expect(examPage.uploadSuccessMessage).toBeVisible();
        await expect(examPage.studentsRows).toHaveCount(6);

        // 6. 4 Aufgaben hinzufügen, jeweils mit ihrem Maximalwert
        const tasks = [
            { name: 'Aufgabe 1', weight: 30 },
            { name: 'Aufgabe 2', weight: 15 },
            { name: 'Aufgabe 3', weight: 20 },
            { name: 'Aufgabe 4', weight: 25 },
        ];

        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            await examPage.addTask(t.name, t.weight);

            // Prüfen, dass die Aufgabe hinzugefügt wurde
            await expect(examPage.tasksRows).toHaveCount(i + 1);
            await expect(examPage.taskMessage).toBeVisible();
        }

        // 7. Prüfungskonfigurationsdaten in einer JSON-Datei speichern
        const examConfig = {
            tasks,
            expectedStudentCount: 6,
        };

        const examJsonPath = join(testDataDir, 'exam-config.json');
        writeFileSync(examJsonPath, JSON.stringify(examConfig, null, 2));
        console.log('➡ Prüfungsdaten gespeichert in:', examJsonPath);
    });

    // 🔹 VOLLSTÄNDIGE VERSION: Die Studierendendaten stammen aus der CSV
    test('füllt die Punkte pro Aufgabe aus, speichert, exportiert und erzeugt die Datendateien (Studierendendaten aus der CSV)', async ({ window }) => {
        const home = new HomePage(window);
        const modules = new ModulesPage(window);
        const thresholds = new ThresholdsPage(window);
        const examPage = new ExamManagementPage(window);

        // 1. Home -> Module
        await home.goToModules();
        await modules.fillModuleForm();
        await modules.saveButton.click();
        await expect(modules.successMessage).toBeVisible();

        // 2. Module -> Threshold
        await modules.nextButton.click();
        await expect(thresholds.titleAdd).toBeVisible();
        await thresholds.waitForLoaded();
        await thresholds.saveThresholds();
        await expect(thresholds.saveMessage).toBeVisible();

        // 3. Threshold -> Upload (Exam Management)
        await thresholds.nextButton.click();
        await expect(examPage.titleUpload).toBeVisible();
        await expect(examPage.studentsTitle).toBeVisible();

        // 4. CSV vorbereiten und importieren
        const testDataDir = join(__dirname, '..', 'data_test');
        mkdirSync(testDataDir, { recursive: true });

        const csvPath = join(testDataDir, 'ecampus_export.csv');
        const csvContent = [
            'mtknr;nachname;vorname;pversuch;pvermerk;Sitzplatz;bewertung',
            '5923847;Müller;Max;1;;;',
            '5762983;Schmidt;Paul;1;;;2',
            '5847123;Schneider;Alexander;1;;;',
            '5983746;Fischer;Lukas;1;;;',
            '5938174;Weber;Leon;1;;;',
            '5792834;Meyer;Jonas;1;;;',
        ].join('\n');

        writeFileSync(csvPath, csvContent, { encoding: 'latin1' });

        // 🔸 Wir parsen die CSV, um die Basisinformationen der Studierenden zu holen
        const baseStudentsFromCsv = parseEcampusCsv(csvPath);

        await examPage.uploadCsv(csvPath);
        await expect(examPage.uploadSuccessMessage).toBeVisible();
        await expect(examPage.studentsRows).toHaveCount(6);

        // 5. 4 Aufgaben mit ihrer Maximalpunktzahl hinzufügen
        const tasks = [
            { name: 'Aufgabe 1', weight: 30 },
            { name: 'Aufgabe 2', weight: 15 },
            { name: 'Aufgabe 3', weight: 20 },
            { name: 'Aufgabe 4', weight: 25 },
        ];
        const taskMaxes = tasks.map(t => t.weight);

        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            await examPage.addTask(t.name, t.weight);
            await expect(examPage.tasksRows).toHaveCount(i + 1);
            await expect(examPage.taskMessage).toBeVisible();
        }

        // 6. Punkte der Studierenden für jede Aufgabe ausfüllen (pseudo-zufällig, ≤ Maximum)
        await examPage.fillGradesForTasks(taskMaxes);

        // 7. Daten in der Anwendung speichern
        await examPage.saveData();
        await expect(examPage.saveSuccessMessage).toBeVisible();

        // 8. Die Export-Buttons müssen aktiviert sein
        await expect(examPage.csvExportButton).toBeEnabled();
        await expect(examPage.excelExportButton).toBeEnabled();
        await expect(examPage.pdfExportButton).toBeEnabled();

        // 9. Auf die Export-Buttons klicken (UI)
        await examPage.csvExportButton.click();
        await expect(examPage.saveErrorMessage).not.toBeVisible();

        await examPage.excelExportButton.click();
        await expect(examPage.saveErrorMessage).not.toBeVisible();

        await examPage.pdfExportButton.click();
        await expect(examPage.saveErrorMessage).not.toBeVisible();

        // 10. Studierendendaten aus der UI extrahieren (Punkte, Gesamt, Endnote usw.)
        const uiStudents = await examPage.extractStudentData(tasks);

        // 🔸 UI-Daten (Punkte, Gesamt, Note) mit den CSV-Daten (pversuch, pvermerk, Sitzplatz, bewertung...) zusammenführen
        const students = uiStudents.map((uiStudent: any) => {
            const fromCsv = baseStudentsFromCsv.find(
                s => s.mtknr === uiStudent.mtknr,
            );

            // bewertung: wir bevorzugen den Wert aus der CSV, falls vorhanden, sonst den aus der UI
            const bewertungFromCsvNumber = fromCsv?.bewertung
                ? Number(fromCsv.bewertung)
                : NaN;

            const bewertung =
                !Number.isNaN(bewertungFromCsvNumber) && bewertungFromCsvNumber > 0
                    ? bewertungFromCsvNumber
                    : uiStudent.bewertung;

            return {
                ...uiStudent,
                pversuch: fromCsv?.pversuch ?? '',
                pvermerk: fromCsv?.pvermerk ?? '',
                sitzplatz: fromCsv?.sitzplatz ?? '',
                bewertung: fromCsv?.bewertung || uiStudent.bewertung,
            };
        });

        // 10.bis. exam-data.json mit den zusammengeführten Daten erzeugen
        const examData = { students };

        const examJsonPath = join(testDataDir, 'exam-data.json');
        writeFileSync(examJsonPath, JSON.stringify(examData, null, 2), 'utf-8');
        console.log('➡ exam-data.json erzeugt :', examJsonPath);

        // 11. CSV/Excel/PDF in data_test aus denselben Daten erzeugen

        // 11.1 CSV
        const header = [
            'mtknr',
            'nachname',
            'vorname',
            'pversuch',
            'pvermerk',
            'sitzplatz',
            ...tasks.map(t => t.name),
            'total',
            'bewertung',
            'note',
        ];

        const csvLines = [header.join(';')];

        for (const s of students) {
            const line = [
                s.mtknr,
                s.nachname,
                s.vorname,
                s.pversuch ?? '',
                s.pvermerk ?? '',
                s.sitzplatz ?? '',
                ...tasks.map(t => s.scores[t.name] ?? 0),
                s.total,
                s.bewertung,
                s.note,
            ];
            csvLines.push(line.join(';'));
        }

        const exportCsvPath = join(testDataDir, 'exam-data.csv');
        writeFileSync(exportCsvPath, csvLines.join('\n'), 'utf-8');
        console.log('➡ exam-data.csv erzeugt :', exportCsvPath);

        // 11.2 "Excel"-Platzhalter (Textinhalt, .xlsx-Endung)
        const exportXlsxPath = join(testDataDir, 'exam-data.xlsx');
        writeFileSync(
            exportXlsxPath,
            'Platzhalter für Excel-Export – bei Bedarf durch eine echte .xlsx-Erzeugung ersetzen.\n',
            'utf-8',
        );
        console.log('➡ exam-data.xlsx erzeugt :', exportXlsxPath);

        // 11.3 "PDF"-Platzhalter (Textinhalt, .pdf-Endung)
        const exportPdfPath = join(testDataDir, 'exam-data.pdf');
        writeFileSync(
            exportPdfPath,
            'Platzhalter für PDF-Export – bei Bedarf durch eine echte PDF-Erzeugung ersetzen.\n',
            'utf-8',
        );
        console.log('➡ exam-data.pdf erzeugt :', exportPdfPath);
    });
});

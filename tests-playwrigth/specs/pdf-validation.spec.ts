// tests-playwrigth/specs/pdf-validation.spec.ts

import { test, expect } from '../fixtures/electronApp.fixture';
import { HomePage } from '../pages/home.page';
import { ModulesPage } from '../pages/modules.page';
import { ThresholdsPage } from '../pages/thresholds.page';
import { ExamManagementPage } from '../pages/exam-management.page';

import {
    writeFileSync,
    mkdirSync,
    existsSync,
    readFileSync,
    statSync,
} from 'fs';
import { join } from 'path';
import { validatePdfStructure } from '../utils/pdf-validator';

/**
 * Ordner und Pfad des PDF, das während der E2E-Tests verwendet wird.
 * WICHTIG: Dieser Pfad muss derselbe sein wie der,
 * der in E2E_PDF_PATH in electronApp.fixture.ts verwendet wird.
 */
const testDataDir = join(__dirname, '..', 'data_test');
const pdfPath = join(testDataDir, 'exam-data.pdf');

/**
 * Warten, bis das PDF erstellt wurde und seine Groesse sich nicht mehr aendert.
 * Dadurch wird vermieden, dass eine noch nicht fertig geschriebene Datei gelesen wird.
 */
async function waitForPdfCreated(targetPath: string, timeoutMs = 10000) {
    const start = Date.now();
    let lastSize = -1;

    while (Date.now() - start < timeoutMs) {
        if (existsSync(targetPath)) {
            const size = statSync(targetPath).size;
            if (size > 0 && size === lastSize) {
                // Groesse aendert sich nicht mehr → Schreiben beendet
                console.log(`✅ PDF erkannt: ${targetPath} (${size} Bytes)`);
                return;
            }
            lastSize = size;
        }
        await new Promise((res) => setTimeout(res, 200));
    }

    throw new Error(`Timeout: PDF nicht erstellt oder unvollstaendig unter ${targetPath}`);
}

/**
 * Prueft, ob eine Datei ein gueltiges PDF ist (Vorhandensein und Header %PDF).
 */
function isValidPdfFile(targetPath: string): boolean {
    if (!existsSync(targetPath)) {
        console.log('❌ PDF-Datei nicht gefunden:', targetPath);
        return false;
    }

    try {
        const pdfBytes = readFileSync(targetPath);
        console.log(`ℹ️ PDF-Groesse: ${pdfBytes.length} Bytes`);

        if (pdfBytes.length === 0) {
            console.log('❌ Leere PDF-Datei');
            return false;
        }

        const header = pdfBytes.toString('utf8', 0, 5);
        if (!header.startsWith('%PDF')) {
            console.log(`❌ PDF-Header fehlt oder ist ungueltig (gelesen: "${header}")`);
            return false;
        }

        return true;
    } catch (error) {
        console.log(`❌ Fehler beim Lesen des PDF: ${error}`);
        return false;
    }
}

test.describe('4.3.1 - Validierung der PDF-Artefakte', () => {
    test.beforeAll(() => {
        // Sicherstellen, dass der Testordner existiert
        mkdirSync(testDataDir, { recursive: true });
    });

    test('a) Validiert die grundlegende Struktur des PDFs', async ({ window }) => {
        await setupExamAndGeneratePdf(window);

        // Warten, bis die Datei von Electron erstellt wurde
        await waitForPdfCreated(pdfPath);

        const isPdfValid = isValidPdfFile(pdfPath);
        expect(isPdfValid, 'Die generierte PDF-Datei ist ungueltig oder fehlt').toBe(
            true,
        );

        // Verarbeitung ueber ein erweitertes Utility
        const pdfData = await validatePdfStructure(pdfPath);

        expect(pdfData.numPages).toBeGreaterThanOrEqual(1);
        expect(pdfData.isValid).toBe(true);
        expect(pdfData.fileSize).toBeGreaterThan(0);

        console.log(
            `✅ Gueltiges PDF: ${pdfData.numPages} Seite(n), ${(pdfData.fileSize / 1024).toFixed(2)} KB`,
        );
    });

    test('b) Validiert die Metadaten des PDFs', async ({ window }) => {
        await setupExamAndGeneratePdf(window);
        await waitForPdfCreated(pdfPath);

        expect(isValidPdfFile(pdfPath)).toBe(true);

        const pdfData = await validatePdfStructure(pdfPath);

        expect(pdfData.metadata).toBeDefined();

        console.log('📋 PDF-Metadaten:', pdfData.metadata);
    });

    test('c) Validiert das Vorhandensein von Inhalt im PDF', async ({ window }) => {
        await setupExamAndGeneratePdf(window);
        await waitForPdfCreated(pdfPath);

        expect(isValidPdfFile(pdfPath)).toBe(true);

        const pdfData = await validatePdfStructure(pdfPath);

        // Wir gehen davon aus, dass ein PDF mit mindestens 1 Seite und > 10KB "Inhalt" besitzt
        expect(pdfData.numPages).toBeGreaterThanOrEqual(1);
        expect(pdfData.fileSize).toBeGreaterThan(10 * 1024);

        console.log(
            `📄 Inhalt als ausreichend eingestuft: ${pdfData.numPages} Seite(n), ${(pdfData.fileSize / 1024).toFixed(2)} KB`,
        );
    });


    test('d) Fehlerbehandlungstest - beschaedigte Datei', async () => {
        const corruptPath = join(testDataDir, 'corrupt.pdf');
        writeFileSync(corruptPath, 'Not a PDF', 'utf-8');

        await expect(validatePdfStructure(corruptPath)).rejects.toThrow();
    });

    test('e) Fehlerbehandlungstest - nicht vorhandene Datei', async () => {
        const nonExistentPath = join(testDataDir, 'nonexistent.pdf');

        await expect(validatePdfStructure(nonExistentPath)).rejects.toThrow();
    });
});

/**
 * Helper zum:
 *  - Konfigurieren des Moduls
 *  - Konfigurieren der Schwellenwerte
 *  - Hochladen der CSV
 *  - Hinzufuegen der Aufgaben
 *  - Ausfuellen der Noten
 *  - Speichern und Starten des PDF-Exports
 */
async function setupExamAndGeneratePdf(window: any) {
    const home = new HomePage(window);
    const modules = new ModulesPage(window);
    const thresholds = new ThresholdsPage(window);
    const examPage = new ExamManagementPage(window);

    // 1. Modulkonfiguration
    await home.goToModules();
    await modules.fillModuleForm();
    await modules.saveButton.click();
    await expect(modules.successMessage).toBeVisible();

    // 2. Schwellenwerte konfigurieren
    await modules.nextButton.click();
    await expect(thresholds.titleAdd).toBeVisible();
    await thresholds.waitForLoaded();
    await thresholds.saveThresholds();
    await expect(thresholds.saveMessage).toBeVisible();

    // 3. CSV-Upload
    await thresholds.nextButton.click();
    await expect(examPage.titleUpload).toBeVisible();

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

    // Latin1-Encoding wie bereits verwendet
    writeFileSync(csvPath, csvContent, { encoding: 'latin1' });
    await examPage.uploadCsv(csvPath);
    await expect(examPage.uploadSuccessMessage).toBeVisible();

    // 4. Aufgaben hinzufuegen
    const tasks = [
        { name: 'Aufgabe 1', weight: 30 },
        { name: 'Aufgabe 2', weight: 15 },
        { name: 'Aufgabe 3', weight: 20 },
        { name: 'Aufgabe 4', weight: 25 },
    ];

    for (const task of tasks) {
        await examPage.addTask(task.name, task.weight);
    }

    // 5. Noten ausfuellen
    await examPage.fillGradesForTasks(tasks.map((t) => t.weight));

    // 6. Speichern
    await examPage.saveData();
    await expect(examPage.saveSuccessMessage).toBeVisible();

    // 7. PDF generieren (der Electron-Handler schreibt ueber E2E_PDF_PATH nach pdfPath)
    await examPage.pdfExportButton.click();
   
}

// tests-playwrigth/specs/csv-validation.spec.ts

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

/**
 * Ordner und Pfad der exportierten CSV-Datei, die während der E2E-Tests verwendet wird.
 * WICHTIG: Dieser Pfad muss derselbe sein wie derjenige, der in
 * E2E_CSV_PATH in electronApp.fixture.ts angegeben ist.
 */
const testDataDir = join(__dirname, '..', 'data_test');
const csvExportPath = join(testDataDir, 'exam-data-export.csv');

/**
 * Warten, bis die Datei erstellt wurde und ihre Größe sich nicht mehr ändert.
 */
async function waitForFileCreated(targetPath: string, timeoutMs = 10000) {
    const start = Date.now();
    let lastSize = -1;

    while (Date.now() - start < timeoutMs) {
        if (existsSync(targetPath)) {
            const size = statSync(targetPath).size;
            if (size > 0 && size === lastSize) {
                console.log(`✅ Datei erkannt: ${targetPath} (${size} Bytes)`);
                return;
            }
            lastSize = size;
        }
        await new Promise((res) => setTimeout(res, 200));
    }

    throw new Error(`Timeout: Datei nicht erstellt oder unvollständig unter ${targetPath}`);
}

/**
 * Prüft, ob eine CSV-Datei vorhanden und nicht leer ist.
 */
function isValidCsvFile(targetPath: string): boolean {
    if (!existsSync(targetPath)) {
        console.log('❌ CSV-Datei nicht gefunden:', targetPath);
        return false;
    }

    try {
        const csvBytes = readFileSync(targetPath);
        console.log(`ℹ️ CSV-Größe: ${csvBytes.length} Bytes`);

        if (csvBytes.length === 0) {
            console.log('❌ Leere CSV-Datei');
            return false;
        }

        return true;
    } catch (error) {
        console.log(`❌ Fehler beim Lesen der CSV: ${error}`);
        return false;
    }
}

/**
 * Einfache CSV-Datei mit „;“ als Trennzeichen parsen,
 * leere Zeilen filtern und ein mögliches Störzeichen (BOM, „ÿ“, etc.)
 * am Anfang der ersten Zelle entfernen.
 */
function parseCsv(content: string): string[][] {
    const lines = content
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

    return lines.map((line, index) => {
        const cols = line.split(';');
        if (index === 0 && cols.length > 0) {
            // Am Anfang alle nicht-ASCII-alphanumerischen Zeichen entfernen
            cols[0] = cols[0].replace(/^[^A-Za-z0-9]+/, '');
        }
        return cols;
    });
}

test.describe('4.3.x - Validierung der CSV-Artefakte', () => {
    test.beforeAll(() => {
        // Sicherstellen, dass der Testordner existiert
        mkdirSync(testDataDir, { recursive: true });
    });

    test('a) Validiert, dass die CSV generiert wurde und nicht leer ist', async ({ window }) => {
        await setupExamData(window);

        const examPage = new ExamManagementPage(window);

        // 1. Auf den CSV-Export-Button klicken ("csv-herunterladen")
        await examPage.csvExportButton.click();

        // 2. Warten, bis die Datei von Electron erstellt wurde (über E2E_CSV_PATH)
        await waitForFileCreated(csvExportPath);

        const valid = isValidCsvFile(csvExportPath);
        expect(valid, 'Die generierte CSV-Datei ist ungültig oder fehlt').toBe(true);
    });

    test('b) Validiert die Struktur (Metadaten + Studententabelle)', async ({
        window,
    }) => {
        await setupExamData(window);

        const examPage = new ExamManagementPage(window);
        await examPage.csvExportButton.click();
        await waitForFileCreated(csvExportPath);

        expect(isValidCsvFile(csvExportPath)).toBe(true);

        // Export erfolgt in Latin1 → daher Latin1 lesen
        const csvContent = readFileSync(csvExportPath, { encoding: 'latin1' });
        const rows = parseCsv(csvContent);

        expect(rows.length).toBeGreaterThan(3);

        // Zeile 0: Metadaten-Header
        const metaHeader = rows[0];

        expect(metaHeader[0]).toBe('Module Title');
        expect(metaHeader[1]).toBe('Module Number');
        expect(metaHeader[2]).toBe('Prüfungsdatum');
        expect(metaHeader[3]).toBe('Prüfer');
        expect(metaHeader[4]).toBe('Exportdatum');

        // Zeile 2: Header der Studententabelle
        const studentsHeader = rows[2];

        // 1) Die ersten 6 Spalten müssen exakt diese sein:
        const expectedPrefix = [
            'MatrikelNr',
            'Nachname',
            'Vorname',
            'Pversuch',
            'Pvermerk',
            'Sitzplatz',
        ];

        expectedPrefix.forEach((col, index) => {
            expect(
                studentsHeader[index],
                `Die Spalte ${index} sollte "${col}" sein, ist aber "${studentsHeader[index]}"`
            ).toBe(col);
        });

        // 2) Überprüfen wichtiger weiterer Spalten
        const expectedOtherColumns = [
            'Aufgabe 1',
            'Aufgabe 2',
            'Aufgabe 3',
            'Aufgabe 4',
            'Gesamt',
            'Bewertung',
            'Note',
        ];

        for (const col of expectedOtherColumns) {
            expect(
                studentsHeader,
                `Die Spalte "${col}" sollte im Header vorhanden sein`
            ).toContain(col);
        }
    });

    test('c) Validiert das Vorhandensein bestimmter Studierendenzeilen', async ({
        window,
    }) => {
        await setupExamData(window);

        const examPage = new ExamManagementPage(window);
        await examPage.csvExportButton.click();
        await waitForFileCreated(csvExportPath);

        expect(isValidCsvFile(csvExportPath)).toBe(true);

        const csvContent = readFileSync(csvExportPath, { encoding: 'latin1' });
        const rows = parseCsv(csvContent);

        // rows[0]: Meta-Header
        // rows[1]: Meta-Werte (Module Title, Module Number, etc.)
        // rows[2]: Studenten-Header
        // rows[3..]: Studentendaten
        expect(rows.length).toBeGreaterThan(3);

        const studentsHeader = rows[2];
        const dataRows = rows.slice(3);

        const matrikelIndex = studentsHeader.indexOf('MatrikelNr');
        expect(matrikelIndex).toBeGreaterThanOrEqual(0);

        const exportedMtknr = dataRows.map((cols) => cols[matrikelIndex]);

        // Erwartete Matrikelnummern (aus der Input-CSV)
        const expectedMtknr = ['5923847', '5762983', '5847123'];
        const found = expectedMtknr.filter((m) => exportedMtknr.includes(m));

        console.log(
            `🔍 Gefundene Matrikelnummern in der exportierten CSV: ${found.length}/${expectedMtknr.length}`,
        );
        found.forEach((m) => console.log(`  ✓ ${m}`));

        expect(
            found.length,
            'Keine der erwarteten Matrikelnummern wurde in der exportierten CSV gefunden',
        ).toBeGreaterThan(0);
    });
});

/**
 * Helper zum:
 *  - Konfigurieren des Moduls
 *  - Konfigurieren der Schwellenwerte
 *  - Hochladen der Eingabe-CSV
 *  - Hinzufügen der Aufgaben
 *  - Ausfüllen der Noten
 *  - Speichern der Daten
 *
 * Der CSV-Export wird HIER NICHT ausgeführt, um ihn
 * in jedem Test gezielt auslösen zu können.
 */
async function setupExamData(window: any) {
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

    // 3. Eingabe-CSV hochladen
    await thresholds.nextButton.click();
    await expect(examPage.titleUpload).toBeVisible();

    const csvInputPath = join(testDataDir, 'ecampus_export.csv');

    const csvContent = [
        'mtknr;nachname;vorname;pversuch;pvermerk;Sitzplatz;bewertung',
        '5923847;Müller;Max;1;;;',
        '5762983;Schmidt;Paul;1;;;2',
        '5847123;Schneider;Alexander;1;;;',
        '5983746;Fischer;Lukas;1;;;',
        '5938174;Weber;Leon;1;;;',
        '5792834;Meyer;Jonas;1;;;',
    ].join('\n');

    // Dasselbe Encoding wie die App verwendet
    writeFileSync(csvInputPath, csvContent, { encoding: 'latin1' });
    await examPage.uploadCsv(csvInputPath);
    await expect(examPage.uploadSuccessMessage).toBeVisible();

    // 4. Aufgaben hinzufügen
    const tasks = [
        { name: 'Aufgabe 1', weight: 30 },
        { name: 'Aufgabe 2', weight: 15 },
        { name: 'Aufgabe 3', weight: 20 },
        { name: 'Aufgabe 4', weight: 25 },
    ];

    for (const task of tasks) {
        await examPage.addTask(task.name, task.weight);
    }

    // 5. Noten eintragen
    await examPage.fillGradesForTasks(tasks.map((t) => t.weight));

    // 6. Daten speichern
    await examPage.saveData();
    await expect(examPage.saveSuccessMessage).toBeVisible();
}

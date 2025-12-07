import type { Page, Locator } from '@playwright/test';

export class ExamManagementPage {
    readonly titleUpload: Locator;
    readonly fileInput: Locator;
    readonly uploadButton: Locator;
    readonly uploadSuccessMessage: Locator;
    readonly uploadErrorMessage: Locator;

    readonly titleTasks: Locator;
    readonly newTaskInput: Locator;
    readonly newTaskWeightInput: Locator;
    readonly addTaskButton: Locator;
    readonly taskMessage: Locator;
    readonly taskError: Locator;
    readonly tasksRows: Locator;

    readonly studentsTitle: Locator;
    readonly studentsRows: Locator;
    readonly gradeInputs: Locator;

    readonly saveButton: Locator;
    readonly saveSuccessMessage: Locator;
    readonly saveErrorMessage: Locator;
    readonly backButton: Locator;
    readonly finishButton: Locator;

    // 🔹 Export-Buttons
    readonly csvExportButton: Locator;
    readonly excelExportButton: Locator;
    readonly pdfExportButton: Locator;

    constructor(private page: Page) {
        // Section upload CSV
        this.titleUpload = page.getByRole('heading', {
            name: /CSV-Datei importieren/i,
        });
        this.fileInput = page.locator('#csvFile');
        this.uploadButton = page.getByRole('button', { name: /Hochladen/i });
        this.uploadSuccessMessage = page
            .locator('div.card:has-text("CSV-Datei importieren")')
            .getByText(/Datei erfolgreich geladen!/);
        this.uploadErrorMessage = page.getByText(
            /Fehler beim Importieren der Datei\. Überprüfen Sie das CSV-Format\./,
        );

        // Section "Übungen verwalten"
        this.titleTasks = page.getByRole('heading', { name: /Übungen verwalten/i });
        this.newTaskInput = page.getByPlaceholder('Aufgabename');
        this.newTaskWeightInput = page.getByPlaceholder('Gewichtung');
        this.addTaskButton = page.getByRole('button', { name: /Hinzufügen/i });
        this.taskMessage = page.getByText(/hinzugefügt;/);
        this.taskError = page.getByText(
            /Bitte geben Sie den Namen der Aufgabe und ihre Gewichtung an\./,
        );
        this.tasksRows = page.locator(
            'div.card:has-text("Übungen verwalten") tbody tr',
        );

        // Section "Studierendenliste"
        this.studentsTitle = page.getByRole('heading', {
            name: /Studierendenliste/i,
        });
        this.studentsRows = page.locator(
            'div.card:has-text("Studierendenliste") tbody tr',
        );

        // Alle Noteneingabefelder
        this.gradeInputs = page.locator(
            'div.card:has-text("Studierendenliste") tbody tr input[type="number"]',
        );

        // Section "Aktionen"
        this.saveButton = page.getByRole('button', { name: /Speichern/i });

        // 🔹 Auf der Karte "Aktionen" gescoped, um Duplikate zu vermeiden
        const actionsCard = page.locator('div.card:has-text("Aktionen")');

        this.saveSuccessMessage = actionsCard.getByText(/Daten erfolgreich gespeichert!/);

        this.saveErrorMessage = page.getByText(/Fehler beim Speichern von Daten\./);

        this.backButton = actionsCard.getByRole('button', { name: /Zurück/i });

        // ❗ FIX HIER: alter Locator zu strikt /^Beenden$/i → nicht gefunden
        // Neuer robuster Locator, Scoping + nicht strikter Match
        this.finishButton = actionsCard.getByRole('button', { name: /Beenden/i });

        this.csvExportButton = actionsCard.locator(
            'button:has(i.fas.fa-file-csv)',
        );

        this.excelExportButton = actionsCard.getByRole('button', {
            name: /Excel herunterladen/i,
        });

        this.pdfExportButton = actionsCard.locator(
            'button:has(i.fas.fa-file-pdf)',
        );
    }

    async uploadCsv(path: string) {
        await this.fileInput.setInputFiles(path);
        await this.uploadButton.click();
    }

    async addTask(name: string, weight: number) {
        await this.newTaskInput.fill(name);
        await this.newTaskWeightInput.fill(weight.toString());
        await this.addTaskButton.click();
    }

    async saveData() {
        await this.saveButton.click();
    }

    // 🔹 Fuellt die Punkte pro Aufgabe aus und beachtet die Maximalwerte pro Aufgabe
    async fillGradesForTasks(taskMaxes: number[]) {
        const rowCount = await this.studentsRows.count();

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = this.studentsRows.nth(rowIndex);
            const inputs = row.locator('input[type="number"]');

            const inputCount = await inputs.count();
            if (inputCount !== taskMaxes.length) {
                throw new Error(
                    `Anzahl der Eingabefelder (${inputCount}) unterscheidet sich von der Anzahl der Aufgaben (${taskMaxes.length}) in Zeile ${rowIndex}`,
                );
            }

            for (let taskIndex = 0; taskIndex < taskMaxes.length; taskIndex++) {
                const maxScore = taskMaxes[taskIndex];

                // 🔸 pseudo-zufaellig aber deterministisch: immer zwischen 0 und maxScore
                let score = 0;
                if (maxScore > 0) {
                    const seed = (rowIndex + 1) * 97 + (taskIndex + 1) * 37;
                    score = seed % (maxScore + 1); // 0..max
                }

                const input = inputs.nth(taskIndex);

                // max-Attribut aus dem DOM prüfen (verknüpft mit [max]="taskWeights[task]")
                const maxAttr = await input.getAttribute('max');
                if (maxAttr) {
                    const maxFromDom = Number(maxAttr);
                    if (!Number.isNaN(maxFromDom) && score > maxFromDom) {
                        score = maxFromDom;
                    }
                }

                await input.fill(score.toString());
            }
        }
    }

    async extractStudentData(tasks: { name: string }[]): Promise<any[]> {
        const rows = this.studentsRows;
        const count = await rows.count();
        const students = [];

        for (let i = 0; i < count; i++) {
            const row = rows.nth(i);

            const tds = row.locator('td');
            const tdCount = await tds.count();

            const mtknr = (await tds.nth(0).innerText()).trim();
            const nachname = (await tds.nth(1).innerText()).trim();
            const vorname = (await tds.nth(2).innerText()).trim();

            // 🔹 alle Punkte fuer jede Aufgabe holen
            const inputs = row.locator('input[type="number"]');
            const inputCount = await inputs.count();

            if (inputCount !== tasks.length) {
                throw new Error(
                    `Anzahl der Eingabefelder (${inputCount}) unterscheidet sich von der Anzahl der Aufgaben (${tasks.length}) fuer Studierenden ${mtknr}`,
                );
            }

            const scores: Record<string, number> = {};
            for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
                const rawScore = await inputs.nth(taskIndex).inputValue();
                const score = Number(rawScore) || 0;
                scores[tasks[taskIndex].name] = score;
            }

            // 🔹 Gesamt, Bewertung, Note: die letzten 3 Spalten
            const total = Number((await tds.nth(tdCount - 3).innerText()).trim());
            const bewertungText = (await tds.nth(tdCount - 2).innerText()).trim();
            const bewertung = Number(bewertungText) || 0;
            const note = (await tds.nth(tdCount - 1).innerText()).trim();

            students.push({
                mtknr,
                nachname,
                vorname,
                pversuch: '1',
                pvermerk: '',
                sitzplatz: '',
                scores,
                total,
                bewertung,
                note,
            });
        }

        return students;
    }

    async exportStudentsJson(
        tasks: { name: string; weight: number }[],
        outputPath: string,
    ) {
        const maxScores = tasks.map(t => t.weight);

        // Fuellt die Punkte unter Beachtung der Maximalwerte aus
        await this.fillGradesForTasks(maxScores);

        // Verwendet dieselbe Aufgabenkonfiguration zum Auslesen der Punkte
        const students = await this.extractStudentData(tasks);
        const json = { students };

        const fs = require('fs');
        fs.writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf-8');

        console.log('➡ JSON erzeugt:', outputPath);
    }
}

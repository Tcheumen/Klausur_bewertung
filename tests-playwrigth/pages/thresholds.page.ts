// tests-playwrigth/pages/thresholds.page.ts
import type { Page, Locator } from '@playwright/test';

export class ThresholdsPage {
    readonly titleAdd: Locator;
    readonly thresholdsRows: Locator;

    readonly newPointsInput: Locator;
    readonly newPercentageInput: Locator;
    readonly newNoteInput: Locator;
    readonly addButton: Locator;

    readonly saveButton: Locator;
    readonly nextButton: Locator;
    readonly saveMessage: Locator;

    readonly loadingSpinner: Locator;
    readonly emptyMessage: Locator;

    constructor(private page: Page) {
        // Titel "Neuen Schwellenwert hinzufügen"
        this.titleAdd = page.getByRole('heading', {
            name: /Neuen Schwellenwert hinzufügen/i,
        });

        // Tabellenzeilen
        this.thresholdsRows = page.locator('table tbody tr');

        // Formularfelder
        this.newPointsInput = page.locator('#new-points');
        this.newPercentageInput = page.locator('#new-percentage');
        this.newNoteInput = page.locator('#new-note');
        this.addButton = page.getByRole('button', { name: /Hinzufügen/ });

        // Buttons Speichern + Weiter
        this.saveButton = page.getByRole('button', { name: /Änderungen Speichern/i });
        this.nextButton = page.getByRole('button', { name: /^Weiter/i });
        this.saveMessage = page.locator('p.alert.alert-success');

        // Loading- und Leerer-Zustand-Locators
        this.loadingSpinner = page.locator('i.fa-spinner');
        this.emptyMessage = page.getByText(/Kein Schwellenwert verfügbar/i);
    }

    /**
     * Wartet auf das Ende des Ladens der Schwellenwerte.
     */
    async waitForLoaded() {
        const raceConditions = [
            this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { }),
            this.thresholdsRows.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => { }),
            this.emptyMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { })
        ];

        await Promise.race(raceConditions);
    }

    /**
     * Fügt einen neuen Schwellenwert über das Formular hinzu.
     */
    async addThreshold(points: number, percentage: number, note: number) {
        await this.newPointsInput.fill(points.toString());
        await this.newPercentageInput.fill(percentage.toString());
        await this.newNoteInput.fill(note.toString());
        await this.addButton.click();
    }

    /**
     * Speichert die Schwellenwerte über den entsprechenden Button.
     */
    async saveThresholds() {
        await this.saveButton.click();
    }
}

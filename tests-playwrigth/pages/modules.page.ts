import type { Page, Locator } from '@playwright/test';

export class ModulesPage {
    readonly title: Locator;
    readonly moduleTitleInput: Locator;
    readonly moduleNumberInput: Locator;
    readonly examDateInput: Locator;
    readonly examinersInput: Locator;
    readonly saveButton: Locator;
    readonly successMessage: Locator;
    readonly nextButton: Locator;

    constructor(private page: Page) {
        // Titel "Modulverwaltung"
        this.title = page.getByRole('heading', { name: /Modulverwaltung/ });

        // Die anderen Felder können mit name= bleiben
        this.moduleTitleInput = page.locator('input[name="moduleTitle"]');
        this.moduleNumberInput = page.locator('input[name="moduleNumber"]');
        this.examDateInput = page.locator('input[name="examDate"]');
        this.examinersInput = page.locator('input[name="examiners"]');

        // Button Speichern/Aktualisieren
        this.saveButton = page.getByRole('button', { name: /Speichern|Aktualisieren/i });

        // Erfolgsmeldung (falls sichtbar)
        this.successMessage = page.locator('p.alert.alert-success');

        // Button "Weiter"
        this.nextButton = page.getByRole('button', { name: /Weiter/ });
    }

    async fillModuleForm() {
        // kleine Wartezeit, damit Angular das Formular rendert
        await this.page.waitForTimeout(300);

        await this.moduleTitleInput.fill('Mathematik I');
        await this.moduleNumberInput.fill('MATH-101');
        await this.examDateInput.fill('2025-12-24'); // yyyy-mm-dd
        await this.examinersInput.fill('Dr. Müller');
    }

    async saveModule() {
        await this.saveButton.click();
    }

    async goToNext() {
        await this.nextButton.click();
    }
}

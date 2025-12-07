import { test, expect } from '../fixtures/electronApp.fixture';
import { HomePage } from '../pages/home.page';
import { ModulesPage } from '../pages/modules.page';

test.describe('Startseite - Modulverwaltungs-App', () => {
    test('zeigt die Hauptelemente an', async ({ window }) => {
        const home = new HomePage(window);

        await expect(home.title).toBeVisible();
        await expect(home.introText).toBeVisible();
        await expect(home.loslegenButton).toBeVisible();
        await expect(home.footer).toBeVisible();
    });

    test('navigiert nach Klick auf „Loslegen“ zur Modulseite', async ({ window }) => {
        const home = new HomePage(window);
        const modules = new ModulesPage(window);

        // Klick auf den Loslegen-Button
        await home.goToModules();

        // Überprüft, dass die Seite „Modulverwaltung“ angezeigt wird
        await expect(modules.title).toBeVisible();

        // (optional) Einige Formularfelder überprüfen
        await expect(modules.moduleTitleInput).toBeVisible();
        await expect(modules.moduleNumberInput).toBeVisible();
        await expect(modules.examDateInput).toBeVisible();
        await expect(modules.examinersInput).toBeVisible();
    });
});

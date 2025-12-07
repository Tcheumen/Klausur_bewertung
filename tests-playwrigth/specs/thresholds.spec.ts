import { test, expect } from '../fixtures/electronApp.fixture';
import { HomePage } from '../pages/home.page';
import { ModulesPage } from '../pages/modules.page';
import { ThresholdsPage } from '../pages/thresholds.page';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

test.describe('Threshold management', () => {
    test('Hinzufügen, Speichern und Navigation der Schwellenwerte', async ({ window }) => {
        const home = new HomePage(window);
        const modules = new ModulesPage(window);
        const thresholdPage = new ThresholdsPage(window);

        // 1. Zur Modulverwaltung navigieren
        await home.goToModules();
        await modules.fillModuleForm();
        await modules.saveButton.click();
        await expect(modules.successMessage).toBeVisible();

        // 2. Zur Seite /threshold wechseln
        await modules.nextButton.click();
        await expect(thresholdPage.titleAdd).toBeVisible();

        //  WICHTIG: auf das Ende des Ladevorgangs warten
        await thresholdPage.waitForLoaded();

        // 3. Anfangsanzahl
        const initialCount = await thresholdPage.thresholdsRows.count();
        console.log('➡ Anfangsanzahl :', initialCount);

        // 4. Mehrere Schwellenwerte hinzufügen
        const thresholdsToAdd = [
            { points: 34, percentage: 50, note: 4 },
            { points: 68, percentage: 95, note: 1.3 },
            { points: 77, percentage: 100, note: 1 },
        ];

        for (const t of thresholdsToAdd) {
            await thresholdPage.addThreshold(t.points, t.percentage, t.note);
        }

        // Prüfen, dass die Tabelle initial + die neuen Einträge enthält
        await expect(thresholdPage.thresholdsRows).toHaveCount(
            initialCount + thresholdsToAdd.length,
        );

        // 5. JSON-Speicherung
        const dir = join(__dirname, '..', 'data_test');
        mkdirSync(dir, { recursive: true });
        const filePath = join(dir, 'thresholds.json');
        writeFileSync(filePath, JSON.stringify(thresholdsToAdd, null, 2));
        console.log('➡ Schwellenwert-Daten gespeichert in', filePath);

        // 6. In der Anwendung speichern
        await thresholdPage.saveThresholds();
        await expect(thresholdPage.nextButton).toBeEnabled();
        await expect(thresholdPage.saveMessage).toBeVisible();

        // 7. Zu /upload navigieren
        await thresholdPage.nextButton.click();
        await expect(window).toHaveURL(/upload/);
    });
});

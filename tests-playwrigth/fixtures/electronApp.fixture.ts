// tests-playwrigth/fixtures/electronApp.fixture.ts
import {
    test as base,
    expect as baseExpect,
    _electron as electron,
    ElectronApplication,
    Page,
} from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

type ElectronFixtures = {
    app: ElectronApplication;
    window: Page;
};

export const test = base.extend<ElectronFixtures>({
    app: async ({ }, use) => {
        const testDataDir = join(__dirname, '..', 'data_test');
        mkdirSync(testDataDir, { recursive: true });

        const pdfPath = join(testDataDir, 'exam-data.pdf');
        const csvExportPath = join(testDataDir, 'exam-data-export.csv');

        const app = await electron.launch({
            args: ['.'],
            env: {
                ...process.env,
                E2E_PDF_PATH: pdfPath,        
                E2E_CSV_PATH: csvExportPath,  
            },
        });

        await use(app);
        await app.close();
    },

    window: async ({ app }, use) => {
        const window = await app.firstWindow();
        await use(window);
    },
});

export const expect = baseExpect;

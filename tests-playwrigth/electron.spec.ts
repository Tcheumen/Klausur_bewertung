import { _electron as electron, test, expect } from '@playwright/test';

test('Starten der Electron-Anwendung', async ({ }) => {
    // Startet die Electron-App
    const app = await electron.launch({
        args: ['electron/main.js']   // Pfad zu deinem main.js / package.json
    });

    // Holt das erste Fenster
    const window = await app.firstWindow();

    // Prüft, dass das Fenster geöffnet wird
    expect(window).not.toBeNull();

    // Beispiel: Titel prüfen
    const title = await window.title();
    console.log('Gefundener Titel:', title);

    expect(title.length).toBeGreaterThan(0);

    // Anwendung schließen
    await app.close();
});

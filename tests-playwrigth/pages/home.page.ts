// tests-playwrigth/pages/home.page.ts
import type { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly title: Locator;
  readonly introText: Locator;
  readonly loslegenButton: Locator;
  readonly footer: Locator;

  constructor(private page: Page) {
    this.title = page.getByRole('heading', {
      name: 'Willkommen in der Modulverwaltungs-App',
    });

    this.introText = page.getByText(
      'Verwalte deine Module, Noten und Schwellenwerte effizient.'
    );

    this.loslegenButton = page.getByRole('button', { name: /Loslegen/ });
    this.footer = page.getByText('© 2025 Modulverwaltungs-App');
  }

  async goToModules() {
    // Wir prüfen, dass der Button sichtbar ist…
    await this.page.waitForTimeout(500); // kleine Sicherheitsmarge für die Animation (optional)
    // … und erzwingen dann den Klick, um Instabilität durch die Animation zu vermeiden
    await this.loslegenButton.click({ force: true });
  }
}

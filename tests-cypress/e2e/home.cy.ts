describe('Startseite', () => {
    it('sollte die Navigationsleiste anzeigen', () => {
        cy.visit('/');
        cy.get('app-navbar').should('exist'); // anpassen, falls dein Komponententag anders ist
    });
});

describe('Startseite - Modulverwaltungs-App', () => {
    // Vor jedem Test zur Startseite navigieren
    // baseUrl = 'http://localhost:4200' ist bereits in cypress.config.ts definiert
    beforeEach(() => {
        cy.visit('/');
    });

    it('zeigt den Titel, den Intro-Text und den Button an', () => {
        // Haupttitel prüfen
        cy.contains('h1', 'Willkommen in der Modulverwaltungs-App')
            .should('be.visible');

        // Einführungstext prüfen
        cy.contains('p', 'Verwalte deine Module, Noten und Schwellenwerte effizient.')
            .should('be.visible');

        // Button „Loslegen“ prüfen
        cy.contains('button', 'Loslegen')
            .should('be.visible')
            .and('have.class', 'btn-success');
    });

    it('navigiert zur Modulseite nach Klick auf den Button', () => {
        cy.contains('button', 'Loslegen').click();

        // ⬇️ Passe "/module" an, falls deine tatsächliche Route anders lautet
        cy.url().should('include', '/module');
    });
});

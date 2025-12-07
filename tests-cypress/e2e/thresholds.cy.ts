describe('Schwellenwerte (Thresholds)', () => {

    it('sollte Schwellenwerte anzeigen und hinzufügen und sie anschließend in einer JSON-Datei speichern', () => {
        const seuils = [
            { punkte: 0, prozentsatz: 0, note: 0 },
            { punkte: 34, prozentsatz: 50, note: 4 },
            { punkte: 68, prozentsatz: 95, note: 1.3 },
            { punkte: 77, prozentsatz: 100, note: 1 }
        ];

        cy.visit('/module');
        cy.contains('Schwellverwaltung').click();
        cy.url().should('include', '/threshold');

        cy.contains('Hinzufügen');
        cy.contains('Zurück');
        cy.contains('Änderungen Speichern');
        cy.contains('Weiter');

        // Schwellenwerte hinzufügen
        seuils.forEach(({ punkte, prozentsatz, note }) => {
            cy.get('input[placeholder="Punkte"]').clear().type(punkte.toString());
            cy.get('input[placeholder="Prozentsatz"]').clear().type(prozentsatz.toString());
            cy.get('input[placeholder="Note"]').clear().type(note.toString());
            cy.contains('Hinzufügen').click();
        });

        // In eine JSON-Datei speichern
        cy.writeFile('cypress/fixtures/schwellenwerte.json', seuils);
    });

    it('zeigt eine Fehlermeldung an, wenn ein Schwellenwert mit einem bereits vorhandenen Prozentsatz hinzugefügt wird', () => {
        cy.visit('/module');
        cy.contains('Schwellverwaltung').click();
        cy.url().should('include', '/threshold');

        // 1. Schwellenwert: prozentsatz = 50
        cy.get('input[placeholder="Punkte"]').clear().type('10');
        cy.get('input[placeholder="Prozentsatz"]').clear().type('50');
        cy.get('input[placeholder="Note"]').clear().type('3');
        cy.contains('Hinzufügen').click();

        // 2. Schwellenwert mit gleichem prozentsatz = 50
        cy.get('input[placeholder="Punkte"]').clear().type('20');
        cy.get('input[placeholder="Prozentsatz"]').clear().type('50');
        cy.get('input[placeholder="Note"]').clear().type('2');
        cy.contains('Hinzufügen').click();

        // Fehlermeldung aus der Angular-Komponente
        cy.contains(
            'Fehler beim Hinzufügen des Schwellenwerts oder dieser Schwellenwert existiert bereits.'
        ).should('be.visible');
    });

    it('navigiert über die Buttons Zurück / Weiter zu /module und /upload', () => {

        const seuils = [
            { punkte: 0, prozentsatz: 0, note: 0 },
            { punkte: 34, prozentsatz: 50, note: 4 },
            { punkte: 68, prozentsatz: 95, note: 1.3 },
            { punkte: 77, prozentsatz: 100, note: 1 }
        ];

        // Start auf der Modulseite
        cy.visit('/module');

        // Zur Seite der Schwellenwerte
        cy.contains('Schwellverwaltung').click();
        cy.url().should('include', '/threshold');

        // 🔙 Button Zurück → /module
        cy.contains('Zurück').click();
        cy.url().should('include', '/module');

        // Zurück zur Seite der Schwellenwerte, um Weiter zu testen
        cy.contains('Schwellverwaltung').click();
        cy.url().should('include', '/threshold');

        // Anfangszustand: Weiter muss deaktiviert sein (isSaved = false)
        cy.contains('Weiter').should('be.disabled');

        // Einen Schwellenwert hinzufügen, um speichern zu können
        seuils.forEach(({ punkte, prozentsatz, note }) => {
            cy.get('input[placeholder="Punkte"]').clear().type(punkte.toString());
            cy.get('input[placeholder="Prozentsatz"]').clear().type(prozentsatz.toString());
            cy.get('input[placeholder="Note"]').clear().type(note.toString());
            cy.contains('Hinzufügen').click();
        });

        // Alle Schwellenwerte speichern → isSaved = true
        cy.contains('Änderungen Speichern').click();

        // Optional: Erfolgsmeldung prüfen
        cy.contains('Alle Schwellenwerte wurden gespeichert.').should('be.visible');

        // ▶️ Jetzt muss Weiter aktiv sein
        cy.contains('Weiter').should('not.be.disabled');

        // ➡️ Button Weiter → /upload
        cy.contains('Weiter').click();
        cy.url().should('include', '/upload');
    });
});

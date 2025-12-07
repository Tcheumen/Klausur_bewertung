describe('Modulverwaltung – Formular', () => {

    beforeEach(() => {
        // baseUrl ist bereits in cypress.config.ts definiert → http://localhost:4200
        cy.visit('/module'); // ❗ Anpassen, falls deine Route anders ist!
    });

    it('zeigt alle Formularfelder an', () => {
        cy.get('#moduleTitle').should('be.visible');
        cy.get('#moduleNumber').should('be.visible');
        cy.get('#examDate').should('be.visible');
        cy.get('#examiners').should('be.visible');
        cy.contains('button', 'Speichern').should('exist');
    });

    it('deaktiviert "Weiter", solange das Modul nicht gespeichert wurde', () => {
        cy.contains('button', 'Weiter').should('be.disabled');
    });

    it('füllt ein Modul korrekt aus und speichert es', () => {

        // Formular ausfüllen
        cy.get('#moduleTitle').type('Analysis I');
        cy.get('#moduleNumber').type('MATH101');
        cy.get('#examDate').type('2025-05-22');
        cy.get('#examiners').type('Dr. Müller');

        // Auf Speichern klicken
        cy.contains('button', 'Speichern').click();

        // Prüfen, ob die Erfolgsmeldung erscheint
        cy.get('.alert-success', { timeout: 3000 })
            .should('be.visible')
            .and(($el) => {
                const text = $el.text().trim();
                expect([
                    'Modul gespeichert!',
                    'Modul wurde erfolgreich hinzugefügt!'
                ]).to.include(text);
            });

        // Prüfen, dass "Weiter" aktiviert ist
        cy.contains('button', 'Weiter').should('not.be.disabled');
    });

    it('zeigt Fehlermeldungen an, wenn ein leeres Formular abgeschickt wird', () => {
        cy.get('#moduleTitle').focus().blur();
        cy.get('#moduleNumber').focus().blur();
        cy.get('#examDate').focus().blur();
        cy.get('#examiners').focus().blur();

        cy.contains('button', 'Speichern').click();

        cy.contains('Der Modultitel ist erforderlich!').should('be.visible');
        cy.contains('Die Modulnummer ist erforderlich!').should('be.visible');
        cy.contains('Das Prüfungsdatum ist erforderlich!').should('be.visible');
        cy.contains('Der Prüfername ist erforderlich!').should('be.visible');

        // Der Button "Weiter" bleibt deaktiviert
        cy.contains('button', 'Weiter').should('be.disabled');
    });
});

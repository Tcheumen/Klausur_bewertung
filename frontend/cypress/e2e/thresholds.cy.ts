describe('Seuils (Thresholds)', () => {
    it('devrait afficher et ajouter des seuils, puis les stocker dans un fichier JSON', () => {
        const seuils = [
            { punkte: 0, prozentsatz: 0, note: 0 },
            { punkte: 34, prozentsatz: 50, note: 4 },
            { punkte: 68, prozentsatz: 95, note: 1.3},
            { punkte: 77, prozentsatz: 100, note: 1 }
        ];

        cy.visit('/module');
        cy.contains('Schwellverwaltung').click();
        cy.url().should('include', '/threshold');

        cy.contains('Hinzufügen');
        cy.contains('Zurück');
        cy.contains('Änderungen Speichern');
        cy.contains('Weiter');

        // Ajouter les seuils
        seuils.forEach(({ punkte, prozentsatz, note }) => {
            cy.get('input[placeholder="Punkte"]').clear().type(punkte.toString());
            cy.get('input[placeholder="Prozentsatz"]').clear().type(prozentsatz.toString());
            cy.get('input[placeholder="Note"]').clear().type(note.toString());
            cy.contains('Hinzufügen').click();
        });

        // Sauvegarder dans un fichier JSON
        cy.writeFile('cypress/fixtures/schwellenwerte.json', seuils);
    });
});

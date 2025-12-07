describe('Module Creation', () => {
    const moduleData = {
        moduleTitle: 'OOP',
        moduleNumber: 'oop123',
        examDate: '2025-04-17',
        examiners: ['Karen']
    };

    it('devrait créer un module avec les données stockées', () => {
        cy.visit('/module');

        // Remplir les champs du formulaire
        cy.get('input[name="moduleTitle"]').type(moduleData.moduleTitle);
        cy.get('input[name="moduleNumber"]').type(moduleData.moduleNumber);
        cy.get('input[name="examDate"]').type(moduleData.examDate);

        cy.get('input[name="examiners"]').type(moduleData.examiners[0]);

        // Cliquer pour enregistrer
        cy.contains('Speichern des Moduls').click();

      

        // Vérifier un message de succès s’il existe
        cy.contains('Modul wurde erfolgreich hinzugefügt!', { timeout: 10000 }).should('exist');
    });
});

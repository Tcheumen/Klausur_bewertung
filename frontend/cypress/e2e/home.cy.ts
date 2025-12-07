describe('Page d’accueil', () => {
    it('devrait afficher la barre de navigation', () => {
        cy.visit('/');
        cy.get('app-navbar').should('exist'); // remplace si ton composant a un autre tag
    });
});
  
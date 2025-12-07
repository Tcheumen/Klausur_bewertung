// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // Angular dev server
    specPattern: 'tests-cypress/e2e/**/*.cy.ts',
    supportFile: 'tests-cypress/support/e2e.ts',
    fixturesFolder: 'tests-cypress/fixtures',
    downloadsFolder: 'tests-cypress/downloads',
    
    defaultCommandTimeout: 10000,
  },
});

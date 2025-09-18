const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Ensure Cypress looks in the right place for spec files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // Base URL for cy.visit(), adjust if you run on a different port
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

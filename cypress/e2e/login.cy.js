describe('Login Page', () => {
    it('should load login page', () => {
      // Uses baseUrl from cypress.config.js
      cy.visit('/auth/signin')
      cy.contains('Sign in')
    })
  })
  
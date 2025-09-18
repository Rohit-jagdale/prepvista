const { faker } = require('@faker-js/faker')

describe('Manual Signup Flow', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('creates an account with email/password and redirects to /app', () => {
    const name = faker.person.fullName()
    const email = faker.internet.email({ provider: 'example.com' })
    const password = faker.internet.password({ length: 12, memorable: true }) + '1!'

    cy.visit('/auth/signup')

    // Name
    cy.get('input[type="text"]').first().clear().type(name)
    // Email
    cy.get('input[type="email"]').clear().type(email)
    // Password
    cy.get('input[type="password"]').clear().type(password)

    cy.contains('button', 'Create account').click()

    // Should sign in automatically and redirect to /app
    cy.url({ timeout: 15000 }).should('include', '/app')
  })
})



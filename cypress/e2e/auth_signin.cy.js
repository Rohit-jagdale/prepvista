const { faker } = require('@faker-js/faker')

describe('Manual Signin Flow', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  it('signs in with credentials and redirects to /app', () => {
    const email = faker.internet.email({ provider: 'example.com' })
    const password = faker.internet.password({ length: 12, memorable: true }) + '1!'

    // Create the user via API first
    cy.request('POST', '/api/auth/register', {
      name: faker.person.fullName(),
      email,
      password,
    }).its('status').should('be.oneOf', [200, 201])

    cy.visit('/auth/signin')

    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[type="password"]').clear().type(password)
    cy.contains('button', 'Sign in').click()

    cy.url({ timeout: 15000 }).should('include', '/app')
  })

  it('rejects invalid credentials (user not in DB)', () => {
    const email = faker.internet.email({ provider: 'example.com' })
    const password = faker.internet.password({ length: 12, memorable: true }) + '1!'

    // Do NOT create the user. Attempt direct signin.
    cy.visit('/auth/signin')

    cy.get('input[type="email"]').clear().type(email)
    cy.get('input[type="password"]').clear().type(password)
    cy.contains('button', 'Sign in').click()

    // Should stay on signin and show error
    cy.url({ timeout: 10000 }).should('include', '/auth/signin')
    cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible')
  })
})



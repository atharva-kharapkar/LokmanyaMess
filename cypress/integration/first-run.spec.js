describe('Lokmanya Mess - Stability E2E Test Suite', () => {
  beforeEach(() => {
    // Clear localStorage to ensure fresh first-run state
    cy.clearLocalStorage();
    // Intercept Firestore network calls to prevent test failures due to firebase config
    cy.intercept('https://firestore.googleapis.com/**', { body: {} });
  });

  it('performs full application workflow: first-run PIN setup, login, member creation, settings, CSV export, and factory reset', () => {
    // 1. Visit the app
    cy.visit('/');

    // 2. First-run PIN configuration modal should appear
    cy.get('.first-run-modal-card').should('be.visible');
    cy.get('.first-run-modal-input').type('999999');
    cy.contains('Save PIN').click();

    // 3. Login pin screen should now be active
    cy.get('.pin-screen').should('be.visible');
    
    // Attempt incorrect login PIN
    cy.get('.form-input').type('111111{enter}');
    cy.get('.toast-notification').should('be.visible');
    
    // Login with correct PIN
    cy.get('.form-input').clear().type('999999{enter}');

    // 4. Main dashboard should be visible
    cy.get('.app-container').should('be.visible');
    cy.contains('Business Dashboard').should('be.visible');

    // 5. Navigate to Dine-in Members tab
    cy.get('.sidebar-item').contains('Dine-in Members').click();
    cy.contains('Manage Dine-in Members').should('be.visible');

    // 6. Add a new customer
    cy.contains('Add Customer').click();
    cy.get('#customer-name-input').type('Test Customer');
    cy.get('#customer-phone-input').type('9876543210');
    cy.get('#customer-fee-input').clear().type('3000');
    cy.get('#customer-deposited-input').clear().type('2500');
    cy.contains('Save Profile').click();
    
    // Verify toast & list entry
    cy.get('.toast-notification').should('contain', 'successfully');
    cy.contains('Test Customer').should('be.visible');

    // 7. Verify warning and dues displays
    cy.contains('Dues Pending').should('be.visible');
    cy.contains('500').should('be.visible'); // 3000 fee - 2500 deposited

    // 8. Trigger CSV export (triggers browser download, no toast shown in browser environment)
    cy.contains('Export CSV').click();

    // 9. Navigate to settings and test updates
    cy.get('.sidebar-item').contains('Settings').click();
    cy.contains('App Settings').should('be.visible');
    
    // Update UPI ID (auto-saves on blur, no toast shown in online/local-only mode)
    cy.get('#settings-upi-input').clear().type('test@upi').blur();

    // Configure archive passcode (4-digit security passcode) using Option 2 (Reset with Owner PIN)
    cy.get('#settings-archive-owner-pin-input').clear().type('999999');
    cy.get('#settings-archive-new-input2').clear().type('4444');
    cy.contains('Reset Passcode').click();
    cy.get('.toast-notification').should('contain', 'successfully');

    // The settings page is now immediately locked. Unlock it using the new passcode
    cy.get('#settings-passcode-input').type('4444{enter}');
    cy.get('.toast-notification').should('contain', 'Granted');

    // 10. Perform and safeguard factory reset
    cy.contains('Unlock Factory Reset').click();
    
    // Enter incorrect passcode first
    cy.get('#factory-reset-unlock-input').type('1111{enter}');
    cy.get('.toast-notification').should('contain', 'Incorrect');
    
    // Enter correct passcode
    cy.get('#factory-reset-unlock-input').clear().type('4444{enter}');
    cy.get('.toast-notification').should('contain', 'Unlocked');

    // Click the now visible Factory Reset button
    cy.contains('Factory Reset (Delete All Data)').click();

    // Confirm using incorrect passcode
    cy.get('#factory-reset-confirm-input').type('1111{enter}');
    cy.get('.toast-notification').should('contain', 'Incorrect');

    // Confirm using correct passcode
    cy.get('#factory-reset-confirm-input').clear().type('4444{enter}');
    cy.get('.toast-notification').should('contain', 'cleared successfully');

    // Go back to Dine-in Members and verify customer is gone (database is empty)
    cy.get('.sidebar-item').contains('Dine-in Members').click();
    cy.contains('Test Customer').should('not.exist');
    cy.contains('No customer records found.').should('be.visible');
  });
});

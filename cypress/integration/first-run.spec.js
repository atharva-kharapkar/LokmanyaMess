describe('First-run PIN setup and IPC checks', () => {
  it('shows first-run modal and saves PIN', () => {
    cy.visit('/');
    // On first run, modal should appear
    cy.get('.first-run-modal-card').should('be.visible');
    cy.get('.first-run-modal-input').type('123456');
    cy.contains('Save PIN').click();
    cy.get('.toast-notification').should('contain', 'Owner PIN set successfully');
  });
});

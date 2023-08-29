describe('shouldLoadGoogletagSwitch', () => {
	beforeEach(() => {
		cy.useConsentedSession('should-load-googletag-switch');
	});

	it('ad slot should be filled when switch is true', () => {
		const path =
			'http://localhost:3030/Front/http://localhost:3031/renderFixture/overwriteShouldLoadGoogletagTrue/uk';
		cy.visit(path);

		// Check that the top-above-nav ad slot is on the page
		cy.get('#dfp-ad--top-above-nav').should('exist');

		// creative isn't loaded unless slot is in view
		cy.get('#dfp-ad--top-above-nav').scrollIntoView();

		// Check that an iframe is placed inside the ad slot
		cy.findAdSlotIframeBySlotId('dfp-ad--top-above-nav').should('exist');
	});

	it('ad slot should be filled when switch is true', () => {
		const path =
			'http://localhost:3030/Front/http://localhost:3031/renderFixture/overwriteShouldLoadGoogletagFalse/uk';
		cy.visit(path);

		// Check that the top-above-nav ad slot is on the page
		cy.get('#dfp-ad--top-above-nav').should('exist');

		// creative isn't loaded unless slot is in view
		cy.get('#dfp-ad--top-above-nav').scrollIntoView();

		// Check that an iframe is placed inside the ad slot
		cy.findAdSlotIframeBySlotId('dfp-ad--top-above-nav').should(
			'not.exist',
		);
	});
});

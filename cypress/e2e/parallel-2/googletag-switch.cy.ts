import { getStage, getTestUrl } from '../../lib/util';

describe('shouldLoadGoogletagSwitch', () => {
	beforeEach(() => {
		cy.useConsentedSession('should-load-googletag-switch');
	});

	it('ad slot should be filled when switch is true', () => {
		// Construct a path that uses a fixture where the `shouldLoadGoogletag` switch is set to true
		const path = getTestUrl(
			getStage(),
			'uk',
			'front',
			undefined, // use the default ad test
			'overwriteShouldLoadGoogletagTrue',
		);
		cy.visit(path);

		// Check that the top-above-nav ad slot is on the page
		cy.get('#dfp-ad--top-above-nav').should('exist');

		// creative isn't loaded unless slot is in view
		cy.get('#dfp-ad--top-above-nav').scrollIntoView();

		// Check that an iframe is placed inside the ad slot
		cy.findAdSlotIframeBySlotId('dfp-ad--top-above-nav').should('exist');
	});

	it('ad slot should be filled when switch is false', () => {
		// Construct a path that uses a fixture where the `shouldLoadGoogletag` switch is set to false
		const path = getTestUrl(
			getStage(),
			'uk',
			'front',
			undefined, // use the default ad test
			'overwriteShouldLoadGoogletagFalse',
		);
		cy.visit(path);

		// eslint-disable-next-line cypress/no-unnecessary-waiting -- Wait for top-above-nav to be removed by commercial code
		cy.wait(5_000);

		// Check that the top-above-nav ad slot is not on the page
		cy.get('#dfp-ad--top-above-nav').should('not.exist');
	});
});

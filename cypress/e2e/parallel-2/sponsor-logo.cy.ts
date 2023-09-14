import { getStage, getTestUrl } from '../../lib/util';

describe('sponsorshipLogo', () => {
	beforeEach(() => {
		cy.useConsentedSession('sponsorship-logo');
	});

	it('sponsor logo ad is correctly filled in thrasher fixture', () => {
		// Construct a path that uses a fixture where a thrasher containers a sponsor logo
		const path = getTestUrl(
			getStage(),
			'uk',
			'front',
			undefined, // use the default ad test
			'sponsorshipLogoInThrasher',
		);
		cy.visit(path);

		// Check that the top-above-nav ad slot is on the page
		cy.get('#dfp-ad--sponsor-logo').should('exist');

		// creative isn't loaded unless slot is in view
		cy.get('#dfp-ad--sponsor-logo').scrollIntoView();

		// Check that an iframe is placed inside the ad slot
		cy.findAdSlotIframeBySlotId('dfp-ad--sponsor-logo').should('exist');
	});
});

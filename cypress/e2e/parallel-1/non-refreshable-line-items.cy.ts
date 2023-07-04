import { articles } from '../../fixtures/pages';
import { breakpoints } from '../../fixtures/breakpoints';

const nonRefreshableLineItemsEndpoint =
	'https://www.theguardian.com/commercial/non-refreshable-line-items.json';

describe('non refreshable line items', () => {
	beforeEach(() => {
		cy.useConsentedSession('non-refresh-line-items');
	});

	it('Non refreshable line item ids are only fetched once a slot becomes viewable', () => {
		// Why are we setting the viewport to mobile here?
		// This is a trick to ensure there isn't an ad in view on page load
		// We'll use this to test that we only fetch non refreshables once an advert has been scrolled into view
		const { width, height } = breakpoints[0];
		cy.viewport(width, height);

		const { path } = articles[0];
		cy.visit(path);

		cy.intercept(
			nonRefreshableLineItemsEndpoint,
			cy.spy().as('nonRefreshableEndpoint'),
		);

		// Assert we haven't made a request for the non-refreshables yet
		// We want this to occur only once the first slot has become viewable
		cy.get('@nonRefreshableEndpoint', { timeout: 5_000 }).should(
			'not.have.been.called',
		);

		// Scroll (an arbitrary) ad slot into view
		cy.get('#dfp-ad--inline1').scrollIntoView({
			// FIXME - For unknown reasons this is required to make sure the slot is in the viewport
			offset: { top: -50, left: 0 },
		});

		// Assert a request has been made for the non refreshable line item ids
		cy.get('@nonRefreshableEndpoint', { timeout: 5_000 }).should(
			'have.been.calledOnce',
		);
	});

	it.skip('Ensure sponsorship level line item does not refresh', () => {
		// TODO - Write a test to ensure that a sponsorship line item does not refresh after 30 seconds
	});
});

import { breakpoints } from '../../fixtures/breakpoints';
import { frontWithPageSkin } from '../../fixtures/pages';
import { mockIntersectionObserver } from '../../lib/util';

const gamUrl = 'https://securepubads.g.doubleclick.net/gampad/ads?**';

const large = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop' || breakpoint === 'wide',
);

const small = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'mobile' || breakpoint === 'tablet',
);

describe('merchandising slot on pages', () => {
	beforeEach(() => {
		cy.useConsentedSession('pageskin-consented');
	});

	large.forEach((breakpoint) => {
		it(`Test ${frontWithPageSkin.path} on ${breakpoint.breakpoint} should display the pageskin background and use single request mode`, () => {
			cy.viewport(breakpoint.width, breakpoint.height);

			cy.intercept(gamUrl, (req) => {
				req.continue((res) => {
					expect(res.headers).to.have.property('google-lineitem-id');
					expect(
						(res.headers['google-lineitem-id'] as string).split(',')
							.length,
					).to.be.greaterThan(1);
				});
			}).as('gamCall');

			cy.visit(frontWithPageSkin.path, {
				onBeforeLoad(win) {
					mockIntersectionObserver(win, '#dfp-ad--top-above-nav');
				},
			});

			cy.wait('@gamCall');

			cy.get('body')
				.should('have.class', 'has-page-skin')
				.should('have.css', 'background-image');
		});
	});

	small.forEach((breakpoint) => {
		it(`Test ${frontWithPageSkin.path} on ${breakpoint.breakpoint} should not display the pageskin and not use single request mode`, () => {
			cy.viewport(breakpoint.width, breakpoint.height);

			cy.intercept(gamUrl, (req) => {
				req.continue((res) => {
					expect(res.headers).to.have.property('google-lineitem-id');
					expect(
						(res.headers['google-lineitem-id'] as string).split(',')
							.length,
					).to.equal(1);
				});
			}).as('gamCall');

			cy.visit(frontWithPageSkin.path, {
				onBeforeLoad(win) {
					mockIntersectionObserver(win, '#dfp-ad--top-above-nav');
				},
			});

			cy.wait('@gamCall');

			cy.get('body')
				.should('have.class', 'has-page-skin')
				.should('have.css', 'background-image');
		});
	});
});

import { breakpoints } from '../../fixtures/breakpoints';
import { articles, liveblogs } from '../../fixtures/pages';
import { mockIntersectionObserver } from '../../lib/util';

const pages = articles.filter(
	(page) =>
		'expectedMinInlineSlotsOnDesktop' in page &&
		'expectedMinInlineSlotsOnMobile' in page,
);

describe('Slots and iframes load on article pages', () => {
	beforeEach(() => {
		cy.useConsentedSession('article-consented');
	});

	pages.forEach(
		({
			path,
			expectedMinInlineSlotsOnDesktop,
			expectedMinInlineSlotsOnMobile,
		}) => {
			breakpoints.forEach(({ breakpoint, width, height }) => {
				const expectedMinSlotsOnPage =
					breakpoint === 'mobile'
						? expectedMinInlineSlotsOnMobile
						: expectedMinInlineSlotsOnDesktop;

				it(`Test ${path} has at least ${expectedMinSlotsOnPage} inline total slots at breakpoint ${breakpoint}`, () => {
					cy.viewport(width, height);

					cy.visit(path, {
						onBeforeLoad(win) {
							mockIntersectionObserver(win, '.ad-slot--inline');
						},
					});

					cy.get('.ad-slot--inline')
						.should('have.length.at.least', expectedMinSlotsOnPage)
						.each((slot) => {
							cy.wrap(slot).scrollIntoView();
							cy.wrap(slot).find('iframe').should('exist');
						});
				});
			});
		},
	);
});

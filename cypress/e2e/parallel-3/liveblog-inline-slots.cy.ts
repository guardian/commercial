import { breakpoints } from '../../fixtures/breakpoints';
import { articles, liveblogs } from '../../fixtures/pages';
import { mockIntersectionObserver } from '../../lib/util';

const liveBlogPages = liveblogs.filter(
	(page) => 'expectedMinInlineSlotsOnPage' in page,
);

describe('Slots and iframes load on liveblog pages', () => {
	beforeEach(() => {
		cy.useConsentedSession('liveblog-consented-2');
	});
	liveBlogPages.forEach(({ path, expectedMinInlineSlotsOnPage }) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			it(`Test ${path} has at least ${expectedMinInlineSlotsOnPage} inline total slots at breakpoint ${breakpoint}`, () => {
				cy.viewport(width, height);

				cy.visit(path, {
					onBeforeLoad(win) {
						mockIntersectionObserver(
							win,
							'.ad-slot--liveblog-inline',
						);
					},
				});

				cy.get('.ad-slot--liveblog-inline').should(
					'have.length.at.least',
					expectedMinInlineSlotsOnPage,
				);
			});
		});
	});
});

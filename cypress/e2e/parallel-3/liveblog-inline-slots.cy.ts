import { breakpoints } from '../../fixtures/breakpoints';
import { liveblogs } from '../../fixtures/pages';
import { mockIntersectionObserver } from '../../lib/util';

const liveBlogPages = liveblogs.filter(
	(page) =>
		'expectedMinInlineSlotsOnDesktop' in page &&
		'expectedMinInlineSlotsOnMobile' in page,
);

describe('Slots and iframes load on liveblog pages', () => {
	beforeEach(() => {
		cy.useConsentedSession('liveblog-consented-2');
	});
	liveBlogPages.forEach(
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
							mockIntersectionObserver(
								win,
								'.ad-slot--liveblog-inline',
							);
						},
					});

					cy.get('.ad-slot--liveblog-inline').should(
						'have.length.at.least',
						expectedMinSlotsOnPage,
					);
				});
			});
		},
	);
});

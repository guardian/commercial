import { breakpoints } from '../../fixtures/breakpoints';
import { liveblogs } from '../../fixtures/pages';
import { mockIntersectionObserver } from '../../lib/util';

const pages = liveblogs.filter(({ name }) => name === 'ad-limit');

const maxAdSlots = 8;

describe('Ad slot limits', () => {
	beforeEach(() => {
		cy.useConsentedSession('liveblog-live-update-consented');
	});

	pages.forEach(({ path, expectedMinInlineSlotsOnDesktop }) => {
		it(`doesn't insert more than 8 ads on desktop`, () => {
			const { width, height } = breakpoints.filter(
				({ breakpoint }) => breakpoint === 'desktop',
			)[0];
			cy.viewport(width, height);

			cy.visit(path, {
				onBeforeLoad(win) {
					mockIntersectionObserver(win, '#top-of-blog');
				},
			});

			cy.get('#liveblog-body .ad-slot')
				.its('length')
				.should('be.equal', expectedMinInlineSlotsOnDesktop);

			// We have 5 ads on the page, adding 7 new blocks should add 3 more ads
			cy.window().invoke('mockLiveUpdate', {
				numNewBlocks: 7,
				html: `
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							`,
				mostRecentBlockId: 'abc',
			});
			cy.get('#liveblog-body .ad-slot')
				.its('length')
				.should('be.equal', maxAdSlots);

			// We have 8 ads on the page (which is the limit), adding 7 new blocks should not add any more ads
			cy.window().invoke('mockLiveUpdate', {
				numNewBlocks: 7,
				html: `
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							<p style="height:1500px;" class="pending block">New block</p>
							`,
				mostRecentBlockId: 'abc',
			});

			cy.get('#liveblog-body .ad-slot')
				.its('length')
				.should('be.equal', maxAdSlots);
		});
	});
});

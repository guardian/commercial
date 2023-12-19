import { _, init } from './liveblog-adverts';

const {
	getSlotName,
	getLowestContentBlock,
	getFirstContentBlockAboveAd,
	getStartingContentBlock,
} = _;

jest.mock('utils/report-error', () => ({
	reportError: jest.fn(),
}));
jest.mock('header-bidding/prebid/prebid', () => ({
	requestBids: jest.fn(),
}));
jest.mock('ophan-tracker-js', () => null);
jest.mock('utils/mediator');
jest.mock('spacefinder/space-filler', () => ({
	spaceFiller: {
		fillSpace: jest.fn(() => Promise.resolve(true)),
	},
}));
jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {
		liveblogAdverts: true,
	},
}));
jest.mock('dfp/fill-dynamic-advert-slot');

describe('Liveblog Dynamic Adverts', () => {
	it('should exist', () => {
		expect(init).toBeDefined();
	});

	describe('getSlotName', () => {
		it('should return the correct slot name', () => {
			const firstMobileSlot = getSlotName(true, 0);
			const thirdMobileSlot = getSlotName(true, 2);
			const firstDesktopSlot = getSlotName(false, 0);

			expect(firstMobileSlot).toBe('top-above-nav');
			expect(thirdMobileSlot).toBe('inline2');
			expect(firstDesktopSlot).toBe('inline1');
		});
	});

	describe('getLowestContentBlock', () => {
		it('should find the lowest slot on the page', async () => {
			document.body.innerHTML = `
				<div class="js-liveblog-body">
					<div class="block x1"></div>
					<div class="block x2"></div>
					<div class="block x3"></div>
				</div>';
			`;

			const result = await getLowestContentBlock();

			expect(result?.classList).toContain('x3');
		});
	});

	describe('getFirstContentBlockAboveAd', () => {
		it('should find the first content block above the ad slot', async () => {
			document.body.innerHTML = `
				<div class="js-liveblog-body">
					<article class="block x1"></article>
					<article class="block x2"></article>
					<div class="ad-slot-container ad-slot-desktop"><div id="dfp-ad--inline1" /></div>
					<article class="block x3"></article>
				</div>';
			`;

			const topAdvert = document.querySelector(
				'.js-liveblog-body > .ad-slot-container.ad-slot-desktop',
			) as Element;

			const result = await getFirstContentBlockAboveAd(topAdvert);

			expect(result?.classList).toContain('x2');
		});

		it('should find the first content block above the top ad slot', async () => {
			document.body.innerHTML = `
				<div class="js-liveblog-body">
					<article class="block x1"></article>
					<article class="block x2"></article>
					<article class="block x3"></article>
					<div class="ad-slot-container ad-slot-desktop"><div id="dfp-ad--inline1" /></div>
					<article class="block x4"></article>
					<article class="block x5"></article>
					<div class="ad-slot-container ad-slot-desktop"><div id="dfp-ad--inline2" /></div>
					<article class="block x6"></article>
				</div>';
			`;

			const topAdvert = document.querySelector(
				'.js-liveblog-body > .ad-slot-container.ad-slot-desktop',
			) as Element;

			const result = await getFirstContentBlockAboveAd(topAdvert);

			expect(result?.classList).toContain('x3');
		});
	});

	describe('getStartingContentBlock', () => {
		it('should find the correct starting block', async () => {
			document.body.innerHTML = `
				<div class="js-liveblog-body">
					<article class="block x1"></article>
					<div class="ad-slot-container ad-slot-desktop"><div id="dfp-ad--inline1" /></div>
					<article class="block x2"></article>
					<article class="block x3"></article>
				</div>';
			`;

			const result = await getStartingContentBlock(
				'.ad-slot-container.ad-slot-desktop',
			);

			expect(result?.classList).toContain('x1');
		});

		it('should find the lowest block when zero ads', async () => {
			document.body.innerHTML = `
				<div class="js-liveblog-body">
					<article class="block x1"></article>
					<article class="block x2"></article>
					<article class="block x3"></article>
				</div>';
			`;

			const result = await getStartingContentBlock(
				'.ad-slot-container.ad-slot-desktop',
			);

			expect(result?.classList).toContain('x3');
		});
	});
});

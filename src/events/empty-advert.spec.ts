import { _ } from './empty-advert';

const { findElementToRemove } = _;

const adSelector = '.js-ad-slot';
const adSlot = `<div class=js-ad-slot></div>`;

const adverts = {
	adSlotWithoutAdContainer: `<div class="not-a-container">${adSlot}</div>`,
	adSlotWithAdContainer: `<div class="ad-slot-container">${adSlot}</div>`,
	frontsBannerAd: `<div class="top-fronts-banner-ad-container"><div class="ad-slot-container">${adSlot}</div></div>`,
} satisfies Record<string, string>;

const createAd = (html: string) => {
	document.body.innerHTML = html;
};

const getAd = (): HTMLElement =>
	document.querySelector(adSelector) as HTMLElement;

describe('findElementToRemove', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('returns the ad slot when NOT in an ad container', () => {
		createAd(adverts['adSlotWithoutAdContainer']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('js-ad-slot');
	});

	it('returns the container when in an ad container', () => {
		createAd(adverts['adSlotWithAdContainer']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('ad-slot-container');
	});

	it('returns the top-level container when advert is a fronts-banner ad', () => {
		createAd(adverts['frontsBannerAd']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('top-fronts-banner-ad-container');
	});
});

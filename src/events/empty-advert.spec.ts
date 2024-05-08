import { _ } from './empty-advert';

const { findElementToRemove } = _;

const adSelector = '.js-ad-slot';
const adSlot = `<div class=js-ad-slot></div>`;

const adverts = {
	adSlotWithoutAdContainer: `<div class="not-a-container">${adSlot}</div>`,
	adSlotWithAdContainer: `<div class="ad-slot-container">${adSlot}</div>`,
	frontsBannerAd: `<div class="top-fronts-banner-ad-container"><div class="ad-slot-container">${adSlot}</div></div>`,
	frontsBannerAdWithExtraDivs: `<div class="top-fronts-banner-ad-container"><div><div><div class="ad-slot-container">${adSlot}</div></div></div></div>`,
	topBannerAd: `<div class="top-banner-ad-container"><div class="ad-slot-container">${adSlot}</div></div>`,
	topBannerAdWithExtraDivs: `<div class="top-banner-ad-container"><div><div><div class="ad-slot-container">${adSlot}</div></div></div></div>`,
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

	it('returns the top-level fronts banner container when separated from the container by extra divs', () => {
		createAd(adverts['frontsBannerAdWithExtraDivs']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('top-fronts-banner-ad-container');
	});

	it('returns the top-level banner container', () => {
		createAd(adverts['topBannerAd']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('top-banner-ad-container');
	});

	it('returns the top-level banner container when separated from the container by extra divs', () => {
		createAd(adverts['topBannerAdWithExtraDivs']);
		const result = findElementToRemove(getAd());
		expect(result.classList).toContain('top-banner-ad-container');
	});
});

import {
	renderAdvertLabel,
	shouldRenderLabel,
	templatesWithoutLabels,
} from './render-advert-label';

jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {},
}));

const adSelector = '.js-ad-slot';

const adverts = {
	withLabel: `
        <div class="js-ad-slot"></div>`,
	labelDisabled: `
        <div class="js-ad-slot" data-label="false"></div>`,
	frame: `
        <div class="js-ad-slot ad-slot--frame"></div>`,
	uh: `
        <div class="js-ad-slot u-h"></div>`,
	topAboveNav: `
        <div class="js-ad-slot" id="dfp-ad--top-above-nav"></div>`,
	fluid: `
        <div class="js-ad-slot ad-slot--fluid"></div>`,
	interscroller: `
        <div class="js-ad-slot ad-slot--interscroller"></div>`,
	collapse: `
        <div class="js-ad-slot ad-slot--collapse"></div>`,
	dataLabelTrue: `
        <div class="js-ad-slot" data-label="true"></div>`,
	dataLabelFalse: `
        <div class="js-ad-slot" data-label="false"></div>`,
} satisfies Record<string, string>;

const createAd = (html: string) => {
	document.body.innerHTML = html;
};

const getAd = (): HTMLElement =>
	document.querySelector(adSelector) as HTMLElement;

// To test the new style of ad label, we need to be able to use the window.getComputedStyle(element, pseudoSelector)
// function, but the pseudo selector capability isn't currently supported by JSDOM. So for now we can't access
// pseudo elements in the DOM while testing, which means we can't test for ad label rendering.
// However, we can at least make sure that 'data-label-show' is correctly assigned for each test case.
describe('shouldRenderLabel', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const testCreativeTemplateId = 1234567;
	const interscrollerTemplateId = 11885667;

	it('renders an ad label for normal ads', async () => {
		createAd(adverts['withLabel']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeTruthy();
		});
	});

	it('renders an ad label for interscroller ads', async () => {
		createAd(adverts['interscroller']);
		return renderAdvertLabel(getAd(), interscrollerTemplateId).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad, interscrollerTemplateId)).toBeTruthy();
		});
	});

	it('renders an ad label for fluid ads', async () => {
		createAd(adverts['fluid']);
		return renderAdvertLabel(getAd(), testCreativeTemplateId).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad, testCreativeTemplateId)).toBeTruthy();
		});
	});

	it('does NOT render an ad label for an ad with an excluded nativeStyleId', async () => {
		for (const nativeAdId of templatesWithoutLabels) {
			createAd(adverts['fluid']);
			await renderAdvertLabel(getAd(), nativeAdId);
			const ad = getAd();
			expect(shouldRenderLabel(ad, nativeAdId)).toBeFalsy();
		}
	});

	it('does NOT render an ad label for collapsed ads', async () => {
		createAd(adverts['collapse']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeFalsy();
		});
	});

	it('renders an ad label when data label attribute is true', async () => {
		createAd(adverts['dataLabelTrue']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeTruthy();
		});
	});

	it('does NOT render an ad label when data label attribute is false', async () => {
		createAd(adverts['dataLabelFalse']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeFalsy();
		});
	});

	it('Will not add a label to frame ads', async () => {
		createAd(adverts['frame']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeFalsy();
		});
	});

	it('Will not add a label to an ad slot with a hidden u-h class', async () => {
		createAd(adverts['uh']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeFalsy();
		});
	});

	it('When the ad is top above nav and the label is NOT toggleable, render the label dynamically', async () => {
		createAd(adverts['topAboveNav']);
		return renderAdvertLabel(getAd()).then(() => {
			const ad = getAd();
			expect(shouldRenderLabel(ad)).toBeTruthy();
		});
	});
});

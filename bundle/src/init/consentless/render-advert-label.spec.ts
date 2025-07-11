import { renderConsentlessAdvertLabel } from './render-advert-label';

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
} satisfies Record<string, string>;

const createAd = (html: string) => {
	document.body.innerHTML = html;
};

const getAd = (): HTMLElement =>
	document.querySelector(adSelector) as HTMLElement;

describe('Rendering advert labels', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	//To test the new style of ad label, we need to be able to use the window.getComputedStyle(element, pseudoSelector)
	//function, but the pseudo selector capability isn't currently supported by JSDOM. So for now we can't access
	//pseudo elements in the DOM while testing, which means we can't test for ad label rendering.
	//However, we can at least make sure that 'data-label-show' is correctly assigned for each test case.

	it('Can add a label', async () => {
		createAd(adverts['withLabel']);
		return renderConsentlessAdvertLabel(getAd()).then(() => {
			const dataLabelShow = getAd().getAttribute('data-label-show');
			expect(dataLabelShow).toBeTruthy();
		});
	});

	it('Will not add a label if it has an attribute data-label="false"', async () => {
		createAd(adverts['labelDisabled']);
		return renderConsentlessAdvertLabel(getAd()).then(() => {
			const dataLabelShow = getAd().getAttribute('data-label-show');
			expect(dataLabelShow).toBeFalsy();
		});
	});

	it('Will not add a label to frame ads', async () => {
		createAd(adverts['frame']);
		return renderConsentlessAdvertLabel(getAd()).then(() => {
			const dataLabelShow = getAd().getAttribute('data-label-show');
			expect(dataLabelShow).toBeFalsy();
		});
	});

	it('Will not add a label to an ad slot with a hidden u-h class', async () => {
		createAd(adverts['uh']);
		return renderConsentlessAdvertLabel(getAd()).then(() => {
			const dataLabelShow = getAd().getAttribute('data-label-show');
			expect(dataLabelShow).toBeFalsy();
		});
	});
});

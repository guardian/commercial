import type { Advert } from '@guardian/commercial-core/types';
import { displayAds } from '../display/display-ads';
import { enableLazyLoad } from '../display/lazy-load';
import { bootCommercial } from '../lib/commercial-boot-utils';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { init as prepareA9 } from './consented/prepare-a9';
import { init as prepareGoogletag } from './consented/prepare-googletag';
import { initPermutive } from './consented/prepare-permutive';
import { init as preparePrebid } from './consented/prepare-prebid';

// all modules needed for commercial code and ads to run
const commercialModules = [
	preparePrebid,
	initDfpListeners,
	// Permutive init code must run before googletag.enableServices() is called
	() => initPermutive().then(prepareGoogletag),
	initDynamicAdSlots,
	prepareA9,
];

// 1. initial page load
// 2. user interaction
// 3. auction and orchestration
// 4. render and measure

class AdController {
	#staticAds: [];
	#dynamicAds: [];

	constructor() {
		this.#staticAds = [];
		this.#dynamicAds = [];
	}

	// Move the responsibility for managing lazy loading to the top level
	// Reduce dependency on dfpEnv and remove redundant code- we can assume IntersectionObserver support
	// and enable/disable lazy loading using commercial features
	public newDynamicAd(ad: Advert) {
		this.#dynamicAds.push(ad);
		enableLazyLoad(ad);
	}

	public newStaticAd(ad: Advert) {
		this.#staticAds.push(ad);
		enableLazyLoad(ad);
	}

	public getAllAds() {
		return this.#dynamicAds.concat(this.#staticAds);
	}
}

const init = async () => {
	const adController = new AdController();

	const googletag = await prepareGoogletag();

	// Pass in the ability to create new dynamic ads- this cannot be controlled at the top level
	prepareSpacefinder(googletag, adController.newDynamicAd.bind(adController));

	await fillStaticAdvertSlots(googletag);

	setPageTargeting(consentState, isSignedIn);

	const staticAds = await createStaticAds(googletag, adController);

	staticAds.forEach((ad) => {
		adController.newStaticAd(ad);
	});
};

// const bootCommercialWhenReady = () => {
// 	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
// 		void bootCommercial(commercialModules);
// 	} else {
// 		window.guardian.queue.push(() => bootCommercial(commercialModules));
// 	}
// };

// export { bootCommercialWhenReady };

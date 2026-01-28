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

const init = async () => {
	await prepareGoogletag();

	void fillStaticAdvertSlots();

	setPageTargeting(consentState, isSignedIn);
};

// const bootCommercialWhenReady = () => {
// 	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
// 		void bootCommercial(commercialModules);
// 	} else {
// 		window.guardian.queue.push(() => bootCommercial(commercialModules));
// 	}
// };

// export { bootCommercialWhenReady };

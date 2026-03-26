import { prepareAdVerification } from '../lib/ad-verification/prepare-ad-verification';
import { bootCommercial } from '../lib/commercial-boot-utils';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { initComscore } from './consented/comscore';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { initFillSlotListener } from './consented/fill-slot-listener';
import { initIpsosMori } from './consented/ipsos-mori';
import { initMessenger } from './consented/messenger';
import { initOpinaryPollListener } from './consented/opinary';
import { prepareA9 } from './consented/prepare-a9';
import { prepareGoogletag } from './consented/prepare-googletag';
import { initPermutive } from './consented/prepare-permutive';
import { preparePrebid } from './consented/prepare-prebid';
import { removeDisabledSlots as closeDisabledSlots } from './consented/remove-slots';
import { initTeadsCookieless } from './consented/teads-cookieless';
import { initThirdPartyTags } from './consented/third-party-tags';
import { initTrackGpcSignal } from './consented/track-gpc-signal';
import { initTrackScrollDepth } from './consented/track-scroll-depth';
import { initPages } from './pages';
import { reloadPageOnConsentChange } from './shared/reload-page-on-consent-change';
import { setAdTestCookie } from './shared/set-adtest-cookie';
import { setAdTestInLabelsCookie } from './shared/set-adtest-in-labels-cookie';

// Initialise messenger immediately
initMessenger();

// all modules needed for commercial code and ads to run
const commercialModules = [
	adFreeSlotRemove,
	closeDisabledSlots,
	initComscore,
	initIpsosMori,
	initTeadsCookieless,
	initTrackScrollDepth,
	initTrackGpcSignal,
	setAdTestCookie,
	setAdTestInLabelsCookie,
	reloadPageOnConsentChange,
	preparePrebid,
	initDfpListeners,
	// Permutive init code must run before googletag.enableServices() is called
	() => initPermutive().then(prepareGoogletag),
	initDynamicAdSlots,
	prepareA9,
	initFillSlotListener,
	prepareAdVerification,
	initThirdPartyTags,
	initOpinaryPollListener,
	initPages,
];

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial(commercialModules);
	} else {
		window.guardian.queue.push(() => bootCommercial(commercialModules));
	}
};

export { bootCommercialWhenReady };

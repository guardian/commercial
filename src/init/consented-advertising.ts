import { init as prepareAdVerification } from '../lib/ad-verification/prepare-ad-verification';
import { bootCommercial, type Modules } from '../lib/init-utils';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { init as initComscore } from './consented/comscore';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { initFillSlotListener } from './consented/fill-slot-listener';
import { init as initIpsosMori } from './consented/ipsos-mori';
import { init as initMessenger } from './consented/messenger';
import { init as prepareA9 } from './consented/prepare-a9';
import { init as prepareGoogletag } from './consented/prepare-googletag';
import { initPermutive } from './consented/prepare-permutive';
import { init as preparePrebid } from './consented/prepare-prebid';
import { removeDisabledSlots as closeDisabledSlots } from './consented/remove-slots';
import { initTeadsCookieless } from './consented/teads-cookieless';
import { init as initThirdPartyTags } from './consented/third-party-tags';
import { init as initTrackGpcSignal } from './consented/track-gpc-signal';
import { init as initTrackScrollDepth } from './consented/track-scroll-depth';
import { reloadPageOnConsentChange } from './shared/reload-page-on-consent-change';
import { init as setAdTestCookie } from './shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from './shared/set-adtest-in-labels-cookie';

// all modules needed for commercial code and ads to run
const commercialModules: Modules = [
	['cm-adFreeSlotRemoveFronts', adFreeSlotRemove],
	['cm-closeDisabledSlots', closeDisabledSlots],
	['cm-comscore', initComscore],
	['cm-ipsosmori', initIpsosMori],
	['cm-teadsCookieless', initTeadsCookieless],
	['cm-trackScrollDepth', initTrackScrollDepth],
	['cm-trackGpcSignal', initTrackGpcSignal],
	['cm-messenger', initMessenger],
	['cm-setAdTestCookie', setAdTestCookie],
	['cm-setAdTestInLabelsCookie', setAdTestInLabelsCookie],
	['cm-reloadPageOnConsentChange', reloadPageOnConsentChange],
	['cm-prepare-prebid', preparePrebid],
	['cm-dfp-listeners', initDfpListeners],
	// Permutive init code must run before google tag enableServices()
	// The permutive lib however is loaded async with the third party tags
	['cm-prepare-googletag', () => initPermutive().then(prepareGoogletag)],
	['cm-dynamic-a-slots', initDynamicAdSlots],
	['cm-prepare-a9', prepareA9],
	['cm-prepare-fill-slot-listener', initFillSlotListener],
	['cm-prepare-adverification', prepareAdVerification],
	['cm-thirdPartyTags', initThirdPartyTags],
];

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial(commercialModules);
	} else {
		window.guardian.queue.push(() => bootCommercial(commercialModules));
	}
};

export { bootCommercialWhenReady };

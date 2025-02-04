import { init as prepareAdVerification } from '../lib/ad-verification/prepare-ad-verification';
import { bootCommercial } from '../lib/commercial-boot-utils';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { init as initComscore } from './consented/comscore';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { initFillSlotListener } from './consented/fill-slot-listener';
import { init as initIpsosMori } from './consented/ipsos-mori';
import { init as initMessenger } from './consented/messenger';
import { init as prepareA9 } from './consented/prepare-a9';
import { init as prepareGoogletag } from './consented/prepare-googletag';
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
const commercialModules = [
	adFreeSlotRemove,
	closeDisabledSlots,
	initComscore,
	initIpsosMori,
	initTeadsCookieless,
	initTrackScrollDepth,
	initTrackGpcSignal,
	initMessenger,
	setAdTestCookie,
	setAdTestInLabelsCookie,
	reloadPageOnConsentChange,
	preparePrebid,
	initDfpListeners,
	prepareGoogletag,
	initDynamicAdSlots,
	prepareA9,
	initFillSlotListener,
	prepareAdVerification,
	initThirdPartyTags,
];

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial(commercialModules);
	} else {
		window.guardian.queue.push(() => bootCommercial(commercialModules));
	}
};

export { bootCommercialWhenReady };

import { bootCommercial } from '../lib/commercial-boot-utils';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { init as initComscore } from './consented/comscore';
import { init as emailTesting } from './consented/identity-fetch';
import { init as initIpsosMori } from './consented/ipsos-mori';
import { removeDisabledSlots as closeDisabledSlots } from './consented/remove-slots';
import { initTeadsCookieless } from './consented/teads-cookieless';
import { init as initTrackGpcSignal } from './consented/track-gpc-signal';
import { init as initTrackScrollDepth } from './consented/track-scroll-depth';
import { init as initPages } from './pages';

// modules not related to ad loading
const commercialModules = [
	adFreeSlotRemove,
	closeDisabledSlots,
	initComscore,
	initIpsosMori,
	initTeadsCookieless,
	initTrackScrollDepth,
	initTrackGpcSignal,
	initPages,
	emailTesting,
];

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial(commercialModules);
	} else {
		window.guardian.queue.push(() => bootCommercial(commercialModules));
	}
};

export { bootCommercialWhenReady };

import { bootCommercial } from '../lib/commercial-boot-utils';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { initComscore } from './consented/comscore';
import { initIpsosMori } from './consented/ipsos-mori';
import { removeDisabledSlots as closeDisabledSlots } from './consented/remove-slots';
import { initTeadsCookieless } from './consented/teads-cookieless';
import { initTrackGpcSignal } from './consented/track-gpc-signal';
import { initTrackScrollDepth } from './consented/track-scroll-depth';
import { initPages } from './pages';

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
];

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial(commercialModules);
	} else {
		window.guardian.queue.push(() => bootCommercial(commercialModules));
	}
};

export { bootCommercialWhenReady };

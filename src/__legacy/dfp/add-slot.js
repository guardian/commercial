import { Advert } from '../dfp/Advert';
import { dfpEnv } from '../dfp/dfp-env';
import { enableLazyLoad } from '../dfp/lazy-load';
import { loadAdvert } from '../dfp/load-advert';
import { queueAdvert } from '../dfp/queue-advert';

const displayAd = (adSlot, forceDisplay) => {
	const advert = new Advert(adSlot);

	dfpEnv.advertIds[advert.id] = dfpEnv.adverts.push(advert) - 1;
	if (dfpEnv.shouldLazyLoad() && !forceDisplay) {
		queueAdvert(advert);
		enableLazyLoad(advert);
	} else {
		loadAdvert(advert);
	}
};

const addSlot = (adSlot, forceDisplay) => {
	window.googletag.cmd.push(() => {
		if (!(adSlot.id in dfpEnv.advertIds)) {
			// dynamically add ad slot
			displayAd(adSlot, forceDisplay);
		}
	});
};

export { addSlot };

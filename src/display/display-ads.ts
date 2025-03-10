import type { Advert } from '../define/Advert';
import { pageSkin } from '../lib/creatives/page-skin';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { loadAdvert } from './load-advert';

const displayAds = (): void => {
	/*
	 * We enable Single Request Architecture (SRA) by invoking:
	 * googletag.pubads().enableSingleRequest()
	 *
	 * This instructs googletag.pubads to combine requests for all (fixed) ads into one request
	 * From this one request Google Ad Manager will then run all auctions for every slot
	 *
	 * We trigger SRA by calling googletag.display() on the first slot
	 * All other unfetched slots will be included in this first request
	 *
	 * https://support.google.com/admanager/answer/183282?hl=en
	 * https://developers.google.com/publisher-tag/reference#googletag.display
	 *
	 */
	window.googletag.pubads().enableSingleRequest();
	window.googletag.pubads().collapseEmptyDivs();
	window.googletag.enableServices();

	const firstAdvertToLoad: Advert | undefined = dfpEnv.advertsToLoad.length
		? dfpEnv.advertsToLoad[0]
		: undefined;

	if (firstAdvertToLoad) {
		loadAdvert(firstAdvertToLoad);
		dfpEnv.advertsToLoad = [];
	}
	pageSkin();
};

export { displayAds };

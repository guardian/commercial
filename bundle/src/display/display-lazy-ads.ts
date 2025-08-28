import { dfpEnv } from '../lib/dfp/dfp-env';
import { disableChildDirectedTreatment } from './disable-child-directed';
import { enableLazyLoad } from './lazy-load';

const displayLazyAds = (): void => {
	disableChildDirectedTreatment();
	window.googletag.pubads().collapseEmptyDivs();
	window.googletag.enableServices();
	dfpEnv.advertsToLoad.forEach(enableLazyLoad);
};

export { displayLazyAds };

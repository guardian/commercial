import { dfpEnv } from '../lib/dfp/dfp-env';
import { enableLazyLoad } from './lazy-load';

const displayLazyAds = (): void => {
	window.googletag.pubads().collapseEmptyDivs();
	window.googletag.enableServices();
	dfpEnv.advertsToLoad.forEach(enableLazyLoad);
};

export { displayLazyAds };

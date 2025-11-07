import { dfpEnv } from '../lib/dfp/dfp-env';
import { enableLazyLoad } from './lazy-load';

const displayLazyAds = (): void => {
	window.googletag.setConfig({
		collapseDiv: 'ON_NO_FILL',
	});
	window.googletag.enableServices();
	dfpEnv.advertsToLoad.forEach(enableLazyLoad);
};

export { displayLazyAds };

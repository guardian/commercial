import { dfpEnv } from '../dfp/dfp-env';
import { enableLazyLoad } from '../dfp/lazy-load';
import { loadAdvert } from '../dfp/load-advert';

const advertsToInstantlyLoad = ['dfp-ad--im'];

const instantLoad = () => {
	const instantLoadAdverts = dfpEnv.advertsToLoad.filter((advert) =>
		advertsToInstantlyLoad.includes(advert.id),
	);

	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(
		(advert) => !advertsToInstantlyLoad.includes(advert.id),
	);

	instantLoadAdverts.forEach(loadAdvert);
};

const displayLazyAds = () => {
	window.googletag.pubads().collapseEmptyDivs();
	window.googletag.enableServices();

	instantLoad();

	dfpEnv.advertsToLoad.forEach((advert) => {
		enableLazyLoad(advert);
	});
};

export { displayLazyAds };

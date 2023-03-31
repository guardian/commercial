import { once } from 'lodash-es';
import { getEagerPrebidVariant } from 'common/modules/experiments/eager-prebid-check';
import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';
import { getAdvertById } from './get-advert-by-id';
import { loadAdvert, refreshAdvert } from './load-advert';

const displayAd = (advertId: string) => {
	const advert = getAdvertById(advertId);
	if (advert) {
		if (advert.isRendered) {
			refreshAdvert(advert);
		} else {
			loadAdvert(advert);
		}
	}
};

const onIntersect = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => {
	const advertIds: string[] = [];

	entries
		.filter((entry) => !('isIntersecting' in entry) || entry.isIntersecting)
		.forEach((entry) => {
			observer.unobserve(entry.target);
			displayAd(entry.target.id);
			advertIds.push(entry.target.id);
		});

	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(
		(advert) => !advertIds.includes(advert.id),
	);
};

// Decide the rootMargin for the IntersectionObserver
// This is based on the variant the user is in, control and
// variant-20 are the same
const decideLazyLoadMargin = (): string => {
	const variant = getEagerPrebidVariant();

	switch (variant) {
		case 'variant-17':
			return '17.5% 0px';
		case 'variant-15':
			return '15% 0px';
		case 'variant-12':
			return '12.5% 0px';
		case 'variant-10':
			return '10% 0px';
		default:
			return '20% 0px';
	}
};

const getObserver = once(() => {
	return Promise.resolve(
		new window.IntersectionObserver(onIntersect, {
			rootMargin: decideLazyLoadMargin(),
		}),
	);
});

export const enableLazyLoad = (advert: Advert): void => {
	if (dfpEnv.lazyLoadObserve) {
		void getObserver().then((observer) => observer.observe(advert.node));
	} else {
		displayAd(advert.id);
	}
};

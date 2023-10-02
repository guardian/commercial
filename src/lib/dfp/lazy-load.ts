import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import { getEagerPrebidVariant } from 'lib/experiments/eager-prebid-check';
import { requestBidsForAd } from 'lib/header-bidding/request-bids';
import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';
import { getAdvertById } from './get-advert-by-id';
import { loadAdvert, refreshAdvert } from './load-advert';

const eagerPrebidVariant = getEagerPrebidVariant() as
	| 'control'
	| 'variant-1'
	| 'variant-2'
	| null;

const lazyLoadMarginOptions = {
	control: '20% 0px',
	'variant-1': '20% 0px', // same as control
	'variant-2': '10% 0px',
};

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

const requestBids = (advertId: string) => {
	const advert = getAdvertById(advertId);
	if (advert) {
		void requestBidsForAd(advert);
	}
};

const onIntersectDisplayAd = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => {
	const advertIds: string[] = [];

	entries
		.filter((entry) => !('isIntersecting' in entry) || entry.isIntersecting)
		.forEach((entry) => {
			log(
				'commercial',
				'display observer triggered for: ',
				entry.target.id,
			);
			observer.unobserve(entry.target);
			displayAd(entry.target.id);
			advertIds.push(entry.target.id);
		});

	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter(
		(advert) => !advertIds.includes(advert.id),
	);
};

const onIntersectPrebid = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => {
	const advertIds: string[] = [];
	entries
		.filter((entry) => !('isIntersecting' in entry) || entry.isIntersecting)
		.forEach((entry) => {
			log(
				'commercial',
				'prebid observer triggered for: ',
				entry.target.id,
			);

			observer.unobserve(entry.target);
			requestBids(entry.target.id);
			advertIds.push(entry.target.id);
		});
};

const getDisplayAdObserver = once(() => {
	return new window.IntersectionObserver(onIntersectDisplayAd, {
		rootMargin: eagerPrebidVariant
			? lazyLoadMarginOptions[eagerPrebidVariant]
			: '20% 0px',
	});
});

const getPrebidObserver = once(() => {
	return new window.IntersectionObserver(onIntersectPrebid, {
		rootMargin: '50% 0px',
	});
});

export const enableLazyLoad = (advert: Advert): void => {
	if (dfpEnv.lazyLoadObserve) {
		getDisplayAdObserver().observe(advert.node);
		if (
			getEagerPrebidVariant() !== null &&
			getEagerPrebidVariant() !== 'control'
		) {
			getPrebidObserver().observe(advert.node);
		}
	} else {
		displayAd(advert.id);
	}
};

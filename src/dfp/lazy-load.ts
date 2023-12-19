import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import { getCurrentBreakpoint } from 'detect/detect-breakpoint';
import { requestBidsForAd } from 'header-bidding/request-bids';
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

const getDisplayAdObserver = once((isEagerPrebid: boolean) => {
	return new window.IntersectionObserver(onIntersectDisplayAd, {
		rootMargin: isEagerPrebid ? '10% 0px' : '20% 0px',
	});
});

const getPrebidObserver = once(() => {
	return new window.IntersectionObserver(onIntersectPrebid, {
		rootMargin: '50% 0px',
	});
});

/**
 * Only load Prebid eagerly on desktop and above
 */
const shouldRunEagerPrebid = () =>
	['desktop', 'wide'].includes(getCurrentBreakpoint());

export const enableLazyLoad = (advert: Advert): void => {
	if (dfpEnv.lazyLoadObserve) {
		const isEagerPrebid = shouldRunEagerPrebid();
		getDisplayAdObserver(isEagerPrebid).observe(advert.node);
		if (isEagerPrebid) {
			getPrebidObserver().observe(advert.node);
		}
	} else {
		displayAd(advert.id);
	}
};

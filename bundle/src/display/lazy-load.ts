import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import type { Advert } from '../define/Advert';
import { getCurrentBreakpoint } from '../lib/detect/detect-breakpoint';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { getAdvertById } from '../lib/dfp/get-advert-by-id';

const displayAd = (advertId: string) => {
	const advert = getAdvertById(advertId);
	advert?.display();
};

const requestBids = (advertId: string) => {
	const advert = getAdvertById(advertId);
	void advert?.requestBids();
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

const onIntersectHeaderBidder = (
	entries: IntersectionObserverEntry[],
	observer: IntersectionObserver,
) => {
	const advertIds: string[] = [];
	entries
		.filter((entry) => !('isIntersecting' in entry) || entry.isIntersecting)
		.forEach((entry) => {
			log(
				'commercial',
				'header bidder observer triggered for: ',
				entry.target.id,
			);

			observer.unobserve(entry.target);
			requestBids(entry.target.id);
			advertIds.push(entry.target.id);
		});
};

const getDisplayAdObserver = once((isEager: boolean) => {
	return new window.IntersectionObserver(onIntersectDisplayAd, {
		rootMargin: isEager ? '10% 0px' : '20% 0px',
	});
});

const getHeaderBidderObserver = once(() => {
	return new window.IntersectionObserver(onIntersectHeaderBidder, {
		rootMargin: '50% 0px',
	});
});

/**
 * Only load header bidders eagerly on desktop and above
 */
const shouldRunEagerHeaderBidding = () =>
	['desktop', 'wide'].includes(getCurrentBreakpoint());

export const enableLazyLoad = (advert: Advert): void => {
	if (dfpEnv.lazyLoadObserve) {
		const isEagerHeaderBidding = shouldRunEagerHeaderBidding();
		getDisplayAdObserver(isEagerHeaderBidding).observe(advert.node);
		if (isEagerHeaderBidding) {
			getHeaderBidderObserver().observe(advert.node);
		}
	} else {
		displayAd(advert.id);
	}
};

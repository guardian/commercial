import { isNonNullable, log } from '@guardian/libs';
import type { SizeMapping } from 'core/ad-sizes';
import { adSizes, createAdSize } from 'core/ad-sizes';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import { isInVariantSynchronous } from 'lib/experiments/ab';
import { isInEagerPrebidVariant } from 'lib/experiments/eager-prebid-check';
import { billboardsInMerchHigh } from 'lib/experiments/tests/billboards-in-merch-high';
import { requestBidsForAds } from '../header-bidding/request-bids';
import { removeDisabledSlots } from '../remove-slots';
import { createAdvert } from './create-advert';
import { dfpEnv } from './dfp-env';
import { displayAds } from './display-ads';
import { displayLazyAds } from './display-lazy-ads';
import { setupPrebidOnce } from './prepare-prebid';
import { queueAdvert } from './queue-advert';

const decideAdditionalSizes = (adSlot: HTMLElement): SizeMapping => {
	const { contentType } = window.guardian.config.page;
	const { name } = adSlot.dataset;

	if (contentType === 'Gallery' && name?.includes('inline')) {
		return {
			desktop: [adSizes.billboard, createAdSize(900, 250)],
		};
	} else if (
		name === 'merchandising-high' &&
		isInVariantSynchronous(billboardsInMerchHigh, 'variant')
	) {
		return {
			desktop: [adSizes.billboard],
		};
	} else if (contentType === 'LiveBlog' && name?.includes('inline')) {
		return {
			phablet: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
			desktop: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
		};
	} else {
		return {};
	}
};

/**
 * Pre-rendered ad slots that were rendered on the page by the server are collected here.
 *
 * For dynamic ad slots that are created at js-runtime, see:
 *  - article-aside-adverts
 *  - article-body-adverts
 *  - liveblog-adverts
 *  - high-merch
 */
const fillAdvertSlots = async (): Promise<void> => {
	// This module has the following strict dependencies. These dependencies must be
	// fulfilled before fillAdvertSlots can execute reliably. The bootstrap
	// initiates these dependencies, to speed up the init process. Bootstrap also captures the module performance.
	const dependencies: Array<Promise<void>> = [removeDisabledSlots()];

	await Promise.all(dependencies);

	// Prebid might not load if it does not have consent
	// TODO: use Promise.allSettled, once we have Node 12
	await setupPrebidOnce().catch((reason) =>
		log('commercial', 'could not load Prebid.js', reason),
	);

	// Quit if ad-free
	if (commercialFeatures.adFree) {
		return Promise.resolve();
	}

	const isDCRMobile =
		window.guardian.config.isDotcomRendering &&
		getCurrentBreakpoint() === 'mobile';

	// Get all ad slots
	const adverts = [
		...document.querySelectorAll<HTMLElement>(dfpEnv.adSlotSelector),
	]
		.filter((adSlot) => !(adSlot.id in dfpEnv.advertIds))
		// TODO: find cleaner workaround
		// we need to not init top-above-nav on mobile view in DCR
		// as the DOM element needs to be removed and replaced to be inline
		// refer to: 3562dc07-78e9-4507-b922-78b979d4c5cb
		.filter(
			(adSlot) => !(isDCRMobile && adSlot.id === 'dfp-ad--top-above-nav'),
		)
		// We cannot guarantee that liveblog-right slots will be on the page when this code runs.
		// liveblog-right slots are inserted by liveblog-right-column-adverts.ts, where they will be
		// inserted when a custom event is received.
		.filter((adSlot) => !adSlot.id.includes('liveblog-right'))
		.map((adSlot) => {
			const additionalSizes = decideAdditionalSizes(adSlot);
			return createAdvert(adSlot, additionalSizes);
		})
		.filter(isNonNullable);

	const currentLength = dfpEnv.adverts.length;
	dfpEnv.adverts = dfpEnv.adverts.concat(adverts);
	adverts.forEach((advert, index) => {
		dfpEnv.advertIds[advert.id] = currentLength + index;
	});

	if (isInEagerPrebidVariant()) {
		// Request bids for all server rendered adverts
		await requestBidsForAds(adverts);
	}

	adverts.forEach(queueAdvert);
	if (dfpEnv.shouldLazyLoad()) {
		displayLazyAds();
	} else {
		displayAds();
	}
};

export { fillAdvertSlots };

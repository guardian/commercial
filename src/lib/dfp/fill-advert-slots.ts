import { isNonNullable, log } from '@guardian/libs';
import type { SizeMapping } from 'core/ad-sizes';
import { adSizes, createAdSize } from 'core/ad-sizes';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import { isInEagerPrebidVariant } from 'lib/experiments/eager-prebid-check';
import { requestBidsForAds } from '../header-bidding/request-bids';
import { removeDisabledSlots } from '../remove-slots';
import { createAdvert } from './create-advert';
import { dfpEnv } from './dfp-env';
import { displayAds } from './display-ads';
import { displayLazyAds } from './display-lazy-ads';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';
import { includeBillboardsInMerchHigh } from './merchandising-high-test';
import { setupPrebidOnce } from './prepare-prebid';
import { queueAdvert } from './queue-advert';

type ExternalSlotCustomEvent = CustomEvent<{
	slotId: string;
}>;

const isCustomEvent = (event: Event): event is CustomEvent => {
	return 'detail' in event;
};

/**
 * Listen for events to fill an additional slot
 *
 * This is for slots that are not fixed (aka SSR) or dynamic (aka injected by spacefinder).
 * They are placed on the page by a non-standard route, for example in a thrasher or some
 * other async process that adds the slot at an unknown time but still expects the
 * commercial runtime to fulfill the slot.
 *
 * The extra logic in addition to dynamic slots covers when:
 * - the commercial runtime loads before the slot so we wait for a custom event
 * - the commercial runtime loads after the slot so we fill the slot immediately
 *
 * These events will not be received from a restricted iframe such, such as a
 * cross-origin or safeframe iframe.
 */
const createSlotFillListener = () => {
	document.addEventListener('gu.commercial.slot.fill', (event: Event) => {
		if (isCustomEvent(event)) {
			const { slotId } = (<ExternalSlotCustomEvent>event).detail;
			const slot = document.getElementById(slotId);
			if (slot) {
				void fillDynamicAdSlot(slot, false);
			}
		}
	});
};

const decideAdditionalSizes = (adSlot: HTMLElement): SizeMapping => {
	const { contentType } = window.guardian.config.page;
	const { name } = adSlot.dataset;

	if (contentType === 'Gallery' && name?.includes('inline')) {
		return {
			desktop: [adSizes.billboard, createAdSize(900, 250)],
		};
	} else if (
		name === 'merchandising-high' &&
		includeBillboardsInMerchHigh()
	) {
		return {
			desktop: [adSizes.billboard],
		};
	} else if (contentType === 'LiveBlog' && name?.includes('inline')) {
		return {
			phablet: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
			desktop: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
		};
	}
	return {};
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

	// Since JS runs to completion, we won't process any events to fill slots
	// until after we've gathered up the initial ad slots in the DOM
	createSlotFillListener();

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

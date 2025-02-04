import { isNonNullable, log } from '@guardian/libs';
import { createAdvert } from '../../define/create-advert';
import { displayAds } from '../../display/display-ads';
import { displayLazyAds } from '../../display/display-lazy-ads';
import { isUserInVariant } from '../../experiments/ab';
import { mpuWhenNoEpic } from '../../experiments/tests/mpu-when-no-epic';
import type { SizeMapping } from '../../lib/ad-sizes';
import { adSizes, createAdSize } from '../../lib/ad-sizes';
import { commercialFeatures } from '../../lib/commercial-features';
import { getCurrentBreakpoint } from '../../lib/detect/detect-breakpoint';
import { dfpEnv } from '../../lib/dfp/dfp-env';
import { queueAdvert } from '../../lib/dfp/queue-advert';
import { isInUk, isInUsa } from '../../lib/geo/geo-utils';
import { initPermutive } from './prepare-permutive';
import { setupPrebidOnce } from './prepare-prebid';
import { removeDisabledSlots } from './remove-slots';

const decideAdditionalSizes = (adSlot: HTMLElement): SizeMapping => {
	const { contentType } = window.guardian.config.page;
	const { name } = adSlot.dataset;

	if (contentType === 'Gallery' && name?.includes('inline')) {
		return {
			desktop: [adSizes.billboard, createAdSize(900, 250)],
		};
	}

	if (contentType === 'LiveBlog' && name?.includes('inline')) {
		return {
			phablet: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
			desktop: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
		};
	}

	if (name === 'article-end' && isInUsa()) {
		return {
			mobile: [adSizes.fluid],
		};
	}

	if (
		name === 'article-end' &&
		isUserInVariant(mpuWhenNoEpic, 'variant') &&
		isInUk()
	) {
		return {
			desktop: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
		};
	}

	return {};
};

/**
 * Static ad slots that were rendered on the page by the server are collected here.
 *
 * For dynamic ad slots that are created at runtime, see:
 *  - article-body-adverts
 *  - high-merch
 */
const fillStaticAdvertSlots = async (): Promise<void> => {
	// This module has the following strict dependencies. These dependencies must be
	// fulfilled before this function can execute reliably. The bootstrap
	// initiates these dependencies, to speed up the init process. Bootstrap also captures the module performance.
	const dependencies: Array<Promise<void>> = [
		removeDisabledSlots(),
		// Permutive segmentation init code must run before google tag enableServices()
		initPermutive(),
	];

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
		.filter((adSlot) => !dfpEnv.adverts.has(adSlot.id))
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

	for (const advert of adverts) {
		dfpEnv.adverts.set(advert.id, advert);
	}

	adverts.forEach(queueAdvert);
	if (dfpEnv.shouldLazyLoad()) {
		displayLazyAds();
	} else {
		displayAds();
	}
};

export { fillStaticAdvertSlots };

import { createAdSize } from '@guardian/commercial-core/ad-sizes';
import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import { log } from '@guardian/libs';
import { createAdSlot } from '../lib/create-ad-slot';
import fastdom from '../lib/fastdom-promise';
import { shouldIncludeMobileSticky } from '../lib/header-bidding/utils';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const createAdWrapperClassic = () => {
	const wrapper = document.createElement('div');
	wrapper.className = 'mobilesticky-container';
	const adSlot = createAdSlot('mobile-sticky', {});
	wrapper.appendChild(adSlot);
	return wrapper;
};

const createAdWrapperDCR = () => {
	const wrapper = document.querySelector('.mobilesticky-container');
	if (wrapper) {
		const adSlot = createAdSlot('mobile-sticky', {});
		wrapper.appendChild(adSlot);
	}
	return wrapper;
};

const createAdWrapper = () => {
	if (!window.guardian.config.isDotcomRendering) {
		return createAdWrapperClassic();
	}
	return createAdWrapperDCR();
};

const renderMobileStickySlot = async () => {
	const mobileStickyWrapper = createAdWrapper();
	await fastdom.mutate(() => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Is body really always defined?
		if (document.body && mobileStickyWrapper) {
			document.body.appendChild(mobileStickyWrapper);
		}
	});

	const additionalSizes = isInUsa()
		? { mobile: [createAdSize(320, 100)] }
		: undefined;

	if (mobileStickyWrapper) {
		const mobileStickyAdSlot =
			mobileStickyWrapper.querySelector<HTMLElement>(
				'#dfp-ad--mobile-sticky',
			);
		if (mobileStickyAdSlot) {
			void fillDynamicAdSlot(mobileStickyAdSlot, true, additionalSizes);
		}
	}
};

/**
 * Initialise mobile sticky ad slot
 * @returns Promise
 */
export const init = (): Promise<void> => {
	const handleBannerEvent = (event: Event): void => {
		log('commercial', `📲 Handling event ${event.type}`);
		// Early exit if CMP still detected on the same page view
		if (document.querySelector('iframe[id*="sp_message_iframe"]')) {
			log(
				'commercial',
				'📲 CMP still present on page. Will not launch mobile-sticky ad slot',
			);
			return;
		}
		log('commercial', '📲 Launching mobile-sticky ad slot');
		void renderMobileStickySlot();
	};
	if (shouldIncludeMobileSticky()) {
		// We only try to load the mobile-sticky slot when one of the following events has been received
		document.addEventListener('banner:close', handleBannerEvent);
		document.addEventListener('banner:none', handleBannerEvent);
		document.addEventListener('banner:sign-in-gate', handleBannerEvent);
		document.addEventListener('cmp:banner-close', handleBannerEvent);
	}

	return Promise.resolve();
};

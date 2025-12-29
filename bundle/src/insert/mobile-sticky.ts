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

/**
 * Initialise mobile sticky ad slot
 * @returns Promise
 */


const renderMobileStickySlot = async () => {
	log('commercial', '🪵 Rendering MobileSticky');
	const mobileStickyWrapper = createAdWrapper();
	await fastdom.mutate(() => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Is body really always defined?
		if (document.body && mobileStickyWrapper) {
			document.body.appendChild(mobileStickyWrapper);
		}
	});
	if (mobileStickyWrapper) {
		const mobileStickyAdSlot =
			mobileStickyWrapper.querySelector<HTMLElement>(
				'#dfp-ad--mobile-sticky',
			);
		if (mobileStickyAdSlot) {
			void fillDynamicAdSlot(mobileStickyAdSlot, true);
		}
	}
};

export const init =  (): Promise<void> => {
	const handleBannerEvent = () => {
		log('commercial', '🪵 Handle Banner Event');
		 void renderMobileStickySlot();
	};

	if (shouldIncludeMobileSticky()) {
		document.addEventListener('banner:close', handleBannerEvent);
		document.addEventListener('banner:none', handleBannerEvent);
	}

	return Promise.resolve();
};

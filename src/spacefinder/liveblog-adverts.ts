import { log } from '@guardian/libs';
import { adSizes } from 'core/ad-sizes';
import { createAdSlot } from 'core/create-ad-slot';
import { getCurrentBreakpoint } from 'detect/detect-breakpoint';
import { fillDynamicAdSlot } from 'dfp/fill-dynamic-advert-slot';
import { commercialFeatures } from 'lib/commercial-features';
import fastdom from 'lib/fastdom-promise';
import { spaceFiller } from 'spacefinder/space-filler';
import type {
	SpacefinderItem,
	SpacefinderOptions,
	SpacefinderRules,
	SpacefinderWriter,
} from 'spacefinder/spacefinder';

/**
 * Maximum number of inline ads to display on the page.
 */
const MAX_ADS = 8;

/**
 * Multiplier of screen height that determines the distance from
 * the top of the page that we can start placing ads.
 */
const PAGE_TOP_MULTIPLIER = 1.5;

/**
 * Multiplier of screen height that sets the minimum distance that two ads can be placed.
 */
const AD_SPACE_MULTIPLIER = 2;

let AD_COUNTER = 0;
let WINDOWHEIGHT: number;
let firstSlot: HTMLElement | undefined;

const getWindowHeight = (doc = document) => {
	if (doc.documentElement.clientHeight) {
		return doc.documentElement.clientHeight;
	}
	return 0; // #? zero, or throw an error?
};

const getSpaceFillerRules = (
	windowHeight: number,
	shouldUpdate = false,
): SpacefinderRules => {
	let prevSlot: SpacefinderItem | undefined;

	const isEnoughSpaceBetweenSlots = (
		prevSlot: SpacefinderItem,
		slot: SpacefinderItem,
	) => Math.abs(slot.top - prevSlot.top) > windowHeight * AD_SPACE_MULTIPLIER;

	const filterSlot = (slot: SpacefinderItem) => {
		if (!prevSlot) {
			prevSlot = slot;
			return !shouldUpdate;
		} else if (isEnoughSpaceBetweenSlots(prevSlot, slot)) {
			prevSlot = slot;
			return true;
		}
		return false;
	};

	console.log('ServerSideAds getSpaceFillerRules firstSlot', firstSlot);

	return {
		bodySelector: '.js-liveblog-body',
		slotSelector: ' > .block',
		fromBottom: shouldUpdate,
		startAt: shouldUpdate ? firstSlot : undefined,
		absoluteMinAbove: shouldUpdate ? 0 : WINDOWHEIGHT * PAGE_TOP_MULTIPLIER,
		minAbove: 0,
		minBelow: 0,
		clearContentMeta: 0,
		selectors: {},
		filter: filterSlot,
	};
};

const getSlotName = (isMobile: boolean, slotCounter: number): string => {
	if (isMobile) {
		return slotCounter === 0 ? 'top-above-nav' : `inline${slotCounter}`;
	}

	return `inline${slotCounter + 1}`;
};

const insertAdAtPara = (para: Node) => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	const container: HTMLElement = document.createElement('div');
	container.className = `ad-slot-container`;

	const ad = createAdSlot('inline', {
		name: getSlotName(isMobile, AD_COUNTER),
		classes: 'liveblog-inline',
	});

	container.appendChild(ad);

	return fastdom
		.mutate(() => {
			if (para.parentNode) {
				/* ads are inserted after the block on liveblogs */
				para.parentNode.insertBefore(container, para.nextSibling);
			}
		})
		.then(async () =>
			fillDynamicAdSlot(ad, false, {
				phablet: [
					adSizes.outstreamDesktop,
					adSizes.outstreamGoogleDesktop,
				],
				desktop: [
					adSizes.outstreamDesktop,
					adSizes.outstreamGoogleDesktop,
				],
			}),
		);
};

const insertAds: SpacefinderWriter = async (paras) => {
	const fastdomPromises = [];
	for (let i = 0; i < paras.length && AD_COUNTER < MAX_ADS; i += 1) {
		const para = paras[i];
		if (para?.parentNode) {
			const result = insertAdAtPara(para);
			fastdomPromises.push(result);
			AD_COUNTER += 1;
		}
	}
	await Promise.all(fastdomPromises);
};

const onUpdate = () => {
	// eslint-disable-next-line no-use-before-define -- circular reference
	stopListening();
	const rules = getSpaceFillerRules(WINDOWHEIGHT, true);
	// eslint-disable-next-line no-use-before-define -- circular reference
	void fill(rules);
};

// const onUpdate = () => {
// 	// eslint-disable-next-line no-use-before-define -- circular reference
// 	stopListening();

// 	void fastdom
// 		.measure(() => {
// 			WINDOWHEIGHT = getWindowHeight();
// 			return WINDOWHEIGHT;
// 		})
// 		.then(getSpaceFillerRules)
// 		// eslint-disable-next-line no-use-before-define -- circular reference
// 		.then((rules) => fill(rules));
// };

const startListening = () => {
	document.addEventListener('liveblog:blocks-updated', onUpdate);
};

const stopListening = () => {
	document.removeEventListener('liveblog:blocks-updated', onUpdate);
};

const insertMoreAds = (rules: SpacefinderRules, isServerSideAds = false) => {
	console.log('ServerSideAds inserting more ads');
	const adContainerClass = !isServerSideAds
		? '.ad-slot-container'
		: getCurrentBreakpoint() === 'mobile'
		? '.ad-slot-container.ad-slot-mobile'
		: '.ad-slot-container.ad-slot-desktop';

	console.log('ServerSideAds adContainerClass', adContainerClass);

	if (AD_COUNTER < MAX_ADS) {
		const el = document.querySelector(
			`${rules.bodySelector} > ${adContainerClass}`,
		);
		if (el && el.previousSibling instanceof HTMLElement) {
			firstSlot = el.previousSibling;
			console.log('ServerSideAds firstSlot 1 ', firstSlot);
		} else {
			firstSlot = undefined;
			console.log('ServerSideAds firstSlot 2', firstSlot);
		}
		startListening();
	} else {
		firstSlot = undefined;
		console.log('ServerSideAds firstSlot 3', firstSlot);
	}
};

const fill = (rules: SpacefinderRules) => {
	const options: SpacefinderOptions = { pass: 'inline1' };

	return spaceFiller
		.fillSpace(rules, insertAds, options)
		.then(() => insertMoreAds(rules));
};

/**
 * Initialise liveblog ad slots
 */
export const init = (): Promise<void> => {
	if (!commercialFeatures.liveblogAdverts) {
		return Promise.resolve();
	}

	const firstMobileAdId = '#dfp-ad--inline1';
	const firstDesktopAdId = '#dfp-ad--top-above-nav--mobile';
	const isServerSideAdsMode =
		!!document.querySelector(firstMobileAdId) ||
		!!document.querySelector(firstDesktopAdId);

	console.log('isServerSideAdsMode', isServerSideAdsMode);

	if (isServerSideAdsMode) {
		log(
			'commercial',
			'Server side inline ads mode. No client-side inline ad slots inserted',
		);
		return fastdom
			.measure(() => {
				WINDOWHEIGHT = getWindowHeight();
				return WINDOWHEIGHT;
			})
			.then(getSpaceFillerRules)
			.then((rules) => insertMoreAds(rules, true));
	}

	return fastdom
		.measure(() => {
			WINDOWHEIGHT = getWindowHeight();
			return WINDOWHEIGHT;
		})
		.then(getSpaceFillerRules)
		.then(fill);
};

export const _ = { getSlotName };

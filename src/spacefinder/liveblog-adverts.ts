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
const MAX_ADS = 18;

/**
 * Multiplier of screen height that determines the distance from
 * the top of the page that we can start placing ads.
 */
const PAGE_TOP_MULTIPLIER = 1.5;

/**
 * Multiplier of screen height that sets the minimum distance that two ads can be placed.
 */
const AD_SPACE_MULTIPLIER = 0.2;

let AD_COUNTER = 0;
let WINDOWHEIGHT: number;
let IS_SERVER_SIDE_MODE = false;
let firstSlot: HTMLElement | undefined;

const getWindowHeight = (doc = document) => doc.documentElement.clientHeight;

const getSpaceFillerRules = (shouldUpdate = false): SpacefinderRules => {
	let prevSlot: SpacefinderItem | undefined;

	const isEnoughSpaceBetweenSlots = (
		prevSlot: SpacefinderItem,
		slot: SpacefinderItem,
	) => {
		console.log(
			'*',
			slot.top - prevSlot.top,
			WINDOWHEIGHT * AD_SPACE_MULTIPLIER,
		);
		return (
			Math.abs(slot.top - prevSlot.top) >
			WINDOWHEIGHT * AD_SPACE_MULTIPLIER
		);
	};

	const filterSlot = (slot: SpacefinderItem) => {
		console.log('slot', slot);
		if (!prevSlot) {
			prevSlot = slot;
			console.log('prevSlot 1', prevSlot);
			return !shouldUpdate;
		}

		if (isEnoughSpaceBetweenSlots(prevSlot, slot)) {
			prevSlot = slot;
			console.log('prevSlot 2', prevSlot);
			return true;
		}

		console.log('prevSlot 3', prevSlot);

		return false;
	};

	console.log('start at', shouldUpdate ? firstSlot : undefined);

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

	let className = `ad-slot-container`;
	if (IS_SERVER_SIDE_MODE) {
		className += ` ad-slot-${isMobile ? 'mobile' : 'desktop'}`;
	}
	container.className = className;

	const ad = createAdSlot('inline', {
		name: getSlotName(isMobile, AD_COUNTER),
		classes: 'liveblog-inline',
	});

	container.appendChild(ad);

	console.log('insertAdAtPara', container);

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
	const rules = getSpaceFillerRules(true);
	// eslint-disable-next-line no-use-before-define -- circular reference
	void fill(rules);
};

const startListening = () => {
	console.log('Starting listening');
	document.addEventListener('liveblog:blocks-updated', onUpdate);
};

const stopListening = () => {
	console.log('Stopping listening');
	document.removeEventListener('liveblog:blocks-updated', onUpdate);
};

const insertMoreAds = () => {
	const isMobile = getCurrentBreakpoint() === 'mobile';

	let adContainerClass = '.ad-slot-container';
	if (IS_SERVER_SIDE_MODE) {
		adContainerClass += `.ad-slot-${isMobile ? 'mobile' : 'desktop'}`;
	}

	console.log('AD_COUNTER', AD_COUNTER);
	if (AD_COUNTER < MAX_ADS) {
		const el = document.querySelector(
			`.js-liveblog-body > ${adContainerClass}`,
		);
		if (el && el.previousSibling instanceof HTMLElement) {
			firstSlot = el.previousSibling;
		} else {
			firstSlot = undefined;
		}
		startListening();
	} else {
		firstSlot = undefined;
	}

	console.log('first slot', firstSlot);
};

const fill = (rules: SpacefinderRules) => {
	const options: SpacefinderOptions = { pass: 'inline1' };

	return spaceFiller.fillSpace(rules, insertAds, options).then(insertMoreAds);
};

/**
 * Initialise liveblog ad slots
 */
export const init = (): Promise<void> => {
	if (!commercialFeatures.liveblogAdverts) {
		return Promise.resolve();
	}

	const isMobile = getCurrentBreakpoint() === 'mobile';
	const firstAdId = isMobile
		? '#dfp-ad--inline1'
		: '#dfp-ad--top-above-nav--mobile';

	IS_SERVER_SIDE_MODE = !!document.querySelector(firstAdId);

	if (IS_SERVER_SIDE_MODE) {
		log(
			'commercial',
			'Server side inline ads mode. No client-side inline ad slots inserted',
		);
		const selector = `.ad-slot-container.ad-slot-${
			isMobile ? 'mobile' : 'desktop'
		}`;

		AD_COUNTER = document.querySelectorAll(selector).length;

		setTimeout(() => {
			console.log('dispatchEvent');
			void fastdom
				.measure(() => {
					WINDOWHEIGHT = getWindowHeight();
					return WINDOWHEIGHT;
				})
				.then(insertMoreAds)
				.then(() => {
					document.dispatchEvent(
						new CustomEvent('liveblog:blocks-updated'),
					);
				});
		}, 10000);

		startListening();
		return Promise.resolve();
	}

	return fastdom
		.measure(() => {
			WINDOWHEIGHT = getWindowHeight();
		})
		.then(() => getSpaceFillerRules(false))
		.then(fill);
};

export const _ = { getSlotName };

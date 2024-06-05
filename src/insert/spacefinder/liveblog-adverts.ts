import { log } from '@guardian/libs';
import { adSizes } from 'core/ad-sizes';
import { createAdSlot } from 'core/create-ad-slot';
import { fillDynamicAdSlot } from 'insert/fill-dynamic-advert-slot';
import { spaceFiller } from 'insert/spacefinder/space-filler';
import type {
	SpacefinderItem,
	SpacefinderOptions,
	SpacefinderRules,
	SpacefinderWriter,
} from 'insert/spacefinder/spacefinder';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import fastdom from 'utils/fastdom-promise';

/**
 * Maximum number of inline ads to display on the page
 */
const MAX_ADS = 8;

/**
 * Multiplier of screen height that determines the minimum distance between any two ads
 */
const AD_GAP_MULTIPLIER = 1.5;

let AD_COUNTER = 0;

const getSlotName = (isMobile: boolean, slotCounter: number): string => {
	if (isMobile) {
		return slotCounter === 0 ? 'top-above-nav' : `inline${slotCounter}`;
	}

	return `inline${slotCounter + 1}`;
};

const insertAdAtPara = (para: Node) => {
	const isMobile = getCurrentBreakpoint() === 'mobile';

	const container = document.createElement('div');
	container.className = `ad-slot-container ad-slot-${
		isMobile ? 'mobile' : 'desktop'
	}`;

	const ad = createAdSlot('inline', {
		name: getSlotName(isMobile, AD_COUNTER),
		classes: `liveblog-inline${isMobile ? '--mobile' : ''}`,
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

const fillSpace = (rules: SpacefinderRules) => {
	const options: SpacefinderOptions = { pass: 'inline1' };

	return spaceFiller.fillSpace(rules, insertAds, options);
};

const shouldInsertAd = (
	blockAboveAd: SpacefinderItem,
	candidateBlock: SpacefinderItem,
	windowHeight: number,
) =>
	Math.abs(blockAboveAd.bottom - candidateBlock.bottom) >
	windowHeight * AD_GAP_MULTIPLIER;

const getSpaceFillerRules = (
	startBlock: HTMLElement,
	windowHeight: number,
): SpacefinderRules => {
	// This is always the content block above the highest inline ad slot on the page.
	// When a new ad slot is inserted, this will become the first content block above it.
	let prevSlot: SpacefinderItem | undefined;
	const filterSlot = (slot: SpacefinderItem) => {
		if (!prevSlot) {
			prevSlot = slot;
			return false;
		}

		if (shouldInsertAd(prevSlot, slot, windowHeight)) {
			prevSlot = slot;
			return true;
		}

		return false;
	};

	return {
		bodySelector: '.js-liveblog-body',
		candidateSelector: ':scope > .block',
		fromBottom: true,
		startAt: startBlock,
		absoluteMinAbove: 0,
		minAbove: 0,
		minBelow: 0,
		clearContentMeta: 0,
		opponentSelectorRules: {},
		filter: filterSlot,
	};
};

/**
 * Recursively looks at the next highest element
 * in the page until we find a content block.
 *
 * We cannot be sure that the element above the ad slot is a content
 * block, as there may be other types of elements inserted into the page.
 */
const getFirstContentBlockAboveAd = async (
	topAdvert: Element,
): Promise<Element | null> => {
	const prevElement = topAdvert.previousElementSibling;
	if (prevElement === null) return null;

	if (prevElement.classList.contains('block')) {
		return prevElement;
	}

	return getFirstContentBlockAboveAd(prevElement);
};

const getLowestContentBlock = async () => {
	return fastdom.measure(() => {
		const allBlocks = document.querySelectorAll(
			'.js-liveblog-body > .block',
		);
		return allBlocks[allBlocks.length - 1] ?? null;
	});
};

/**
 * Finds the content block to start with when using Spacefinder.
 *
 * Spacefinder will iterate through blocks looking for spaces to
 * insert ads, so we need to tell it where to start.
 */
const getStartingContentBlock = async (slotSelector: string) => {
	const topAdvert = document.querySelector(
		`.js-liveblog-body > ${slotSelector}`,
	);
	if (topAdvert === null) {
		return await getLowestContentBlock();
	}

	return getFirstContentBlockAboveAd(topAdvert);
};

const lookForSpacesForAdSlots = async () => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	const slotSelector = `.ad-slot-container.ad-slot-${
		isMobile ? 'mobile' : 'desktop'
	}`;

	return fastdom
		.measure(() => {
			const numSlots = document.querySelectorAll(slotSelector).length;
			if (numSlots >= MAX_ADS) {
				throw new Error(
					'Cannot insert any more inline ads. At ad slot limit.',
				);
			}

			AD_COUNTER = numSlots;
		})
		.then(async () => {
			const startContentBlock = (await getStartingContentBlock(
				slotSelector,
			)) as HTMLElement | null;

			if (!startContentBlock) {
				throw new Error(
					'Cannot insert new inline ads. Cannot find a content block to start searching',
				);
			}

			return startContentBlock;
		})
		.then((startContentBlock) => {
			return fastdom
				.measure(() => document.documentElement.clientHeight)
				.then((windowHeight) =>
					getSpaceFillerRules(startContentBlock, windowHeight),
				)
				.then(fillSpace);
		})
		.catch((error) => {
			log('commercial', error);
		});
};

const startListening = () => {
	// eslint-disable-next-line no-use-before-define -- circular reference
	document.addEventListener('liveblog:blocks-updated', onUpdate);
};

const stopListening = () => {
	// eslint-disable-next-line no-use-before-define -- circular reference
	document.removeEventListener('liveblog:blocks-updated', onUpdate);
};

const onUpdate = (): void => {
	stopListening();

	void lookForSpacesForAdSlots();
};

/**
 * Inserts inline ad slots between new content
 * blocks when they are pushed to the page.
 */
export const init = (): Promise<void> => {
	if (commercialFeatures.liveblogAdverts) {
		void startListening();
	}

	return Promise.resolve();
};

export const _ = {
	getFirstContentBlockAboveAd,
	getLowestContentBlock,
	getSlotName,
	getStartingContentBlock,
};

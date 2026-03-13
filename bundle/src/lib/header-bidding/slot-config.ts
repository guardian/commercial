import type { AdSize } from '@guardian/commercial-core/ad-sizes';
import { adSizes } from '@guardian/commercial-core/ad-sizes';
import { isInUk } from '@guardian/commercial-core/geo/geo-utils';
import type { Size } from 'prebid.js/dist/src/types/common';
import type { Advert } from '../../define/Advert';
import type {
	HeaderBiddingSizeKey,
	HeaderBiddingSizeMapping,
	HeaderBiddingSlot,
	HeaderBiddingSlotName,
	SlotFlatMap,
} from './prebid-types';
import { getBreakpointKey, shouldIncludeMobileSticky } from './utils';

const getHbBreakpoint = () => {
	switch (getBreakpointKey()) {
		case 'M':
			return 'mobile';
		case 'T':
			return 'tablet';
		default:
			return 'desktop';
	}
};

/**
 * Remove any header bidding sizes that do not appear in the set
 * of slot sizes for the current breakpoint
 *
 * NOTE we currently only perform this filtering on `inline` slots
 * (this does not include inline1)
 */
const filterBySizeMapping =
	(slotSizes: readonly AdSize[] = []) =>
	({ key, sizes }: HeaderBiddingSlot): HeaderBiddingSlot => {
		// For now, only apply filtering to inline header bidding slots
		// In the future we may want to expand this to all slots
		if (key !== 'inline') {
			return { key, sizes };
		}

		const filteredSizes = sizes.filter(([hbWidth, hbHeight]) =>
			slotSizes.some(
				(adSize) =>
					hbWidth === adSize.width && hbHeight === adSize.height,
			),
		);

		return {
			key,
			sizes: filteredSizes,
		};
	};

const getHeaderBiddingKey = (
	slotName: HeaderBiddingSlotName[],
	name: string | undefined,
): HeaderBiddingSizeKey | undefined => {
	if (slotName.some((key) => key === name)) {
		return name as HeaderBiddingSizeKey;
	}

	if (name?.includes('inline')) {
		return 'inline';
	}

	if (name?.includes('fronts-banner')) {
		return 'fronts-banner';
	}

	return undefined;
};

const getSlotNamesFromSizeMapping = (
	sizeMapping: HeaderBiddingSizeMapping,
): HeaderBiddingSlotName[] =>
	Object.keys(sizeMapping).filter(
		(key): key is HeaderBiddingSlotName => key !== 'inline',
	);

const filterByAdvert = (
	ad: Advert,
	breakpoint: 'mobile' | 'tablet' | 'desktop',
	sizeMapping: HeaderBiddingSizeMapping,
): HeaderBiddingSlot[] => {
	const slotNames = getSlotNamesFromSizeMapping(sizeMapping);
	const key = getHeaderBiddingKey(slotNames, ad.node.dataset.name);

	if (!key) {
		return [];
	}

	const sizes = sizeMapping[key]?.[breakpoint];

	if (!sizes || sizes.length < 1) {
		return [];
	}

	return [
		{
			key,
			sizes,
		},
	];
};

/**
 * convert AdSize objects to Size type
 */
const getAdSize = (name: keyof typeof adSizes) => adSizes[name] as Size;

const getSlots = (): HeaderBiddingSizeMapping => {
	const { contentType, hasShowcaseMainElement } = window.guardian.config.page;
	const isArticle = contentType === 'Article';
	const hasExtendedMostPop =
		isArticle && window.guardian.config.switches.extendedMostPopular;

	return {
		right: {
			desktop: hasShowcaseMainElement
				? [getAdSize('mpu')]
				: [getAdSize('halfPage'), getAdSize('mpu')],
			tablet: hasShowcaseMainElement
				? [getAdSize('mpu')]
				: [getAdSize('halfPage'), getAdSize('mpu')],
			mobile: hasShowcaseMainElement
				? [getAdSize('mpu')]
				: [getAdSize('halfPage'), getAdSize('mpu')],
		},
		'top-above-nav': {
			desktop: [getAdSize('billboard'), getAdSize('leaderboard')],
			tablet: [getAdSize('leaderboard')],
			mobile: [getAdSize('mpu')],
		},
		'fronts-banner': {
			desktop: [getAdSize('billboard')],
		},
		inline: {
			desktop: isArticle
				? [
						getAdSize('skyscraper'),
						getAdSize('halfPage'),
						getAdSize('mpu'),
					]
				: [getAdSize('mpu')],
			tablet: [getAdSize('mpu')],
			mobile: [getAdSize('mpu')],
		},
		inline1: {
			desktop: isArticle
				? [getAdSize('mpu'), getAdSize('outstreamDesktop')]
				: [getAdSize('mpu')],
			tablet: isArticle
				? [getAdSize('mpu'), getAdSize('outstreamDesktop')]
				: [getAdSize('mpu')],
			mobile: isArticle
				? [
						getAdSize('outstreamMobile'),
						getAdSize('mpu'),
						getAdSize('portraitInterstitial'),
					]
				: [getAdSize('mpu')],
		},
		inline2: {
			desktop: isArticle
				? [
						getAdSize('skyscraper'),
						getAdSize('halfPage'),
						getAdSize('mpu'),
					]
				: [getAdSize('mpu')],
			tablet: [getAdSize('mpu')],
			mobile: isArticle
				? [
						getAdSize('mpu'),
						getAdSize('portraitInterstitial'),
						getAdSize('pubmaticInterscroller'),
					]
				: [getAdSize('mpu')],
		},
		mostpop: {
			desktop: hasExtendedMostPop
				? [getAdSize('halfPage'), getAdSize('mpu')]
				: [getAdSize('mpu')],
			tablet: hasExtendedMostPop
				? [
						getAdSize('halfPage'),
						getAdSize('mpu'),
						getAdSize('leaderboard'),
					]
				: [getAdSize('mpu')],
			mobile: [getAdSize('mpu')],
		},
		comments: {
			desktop: [
				getAdSize('skyscraper'),
				getAdSize('mpu'),
				getAdSize('halfPage'),
			],
		},
		'comments-expanded': {
			desktop: [
				getAdSize('skyscraper'),
				getAdSize('mpu'),
				getAdSize('halfPage'),
			],
		},
		banner: {
			// Banner slots appear on interactives, like on
			// https://www.theguardian.com/us-news/ng-interactive/2018/nov/06/midterm-elections-2018-live-results-latest-winners-and-seats
			desktop: [
				[88, 70],
				getAdSize('leaderboard'),
				getAdSize('cascade'),
				[900, 250],
				getAdSize('billboard'),
			],
		},
		'mobile-sticky': {
			mobile: shouldIncludeMobileSticky()
				? [getAdSize('mobilesticky'), [300, 50]]
				: [],
		},
		'crossword-banner-mobile': {
			mobile: [getAdSize('mobilesticky')],
		},
		'football-right': {
			desktop: [
				getAdSize('empty'),
				getAdSize('mpu'),
				getAdSize('skyscraper'),
				getAdSize('halfPage'),
			],
		},
		merchandising: {
			mobile: [getAdSize('mpu')],
			desktop: [getAdSize('billboard')],
		},
		'merchandising-high': {
			mobile: [getAdSize('mpu')],
			desktop: [getAdSize('billboard')],
		},
		'article-end': {
			mobile: isInUk() ? [getAdSize('mpu')] : [],
			tablet: isInUk() ? [getAdSize('mpu')] : [],
			desktop: isInUk() ? [getAdSize('mpu')] : [],
		},
	};
};

export const getHeaderBiddingAdSlots = (
	ad: Advert,
	slotFlatMap: SlotFlatMap = (s) => [s],
): HeaderBiddingSlot[] => {
	const breakpoint = getHbBreakpoint();
	const headerBiddingSlots = filterByAdvert(ad, breakpoint, getSlots());

	return headerBiddingSlots
		.map(filterBySizeMapping(ad.sizes[breakpoint]))
		.map(slotFlatMap)
		.reduce((acc, elt) => acc.concat(elt), []); // the "flat" in "flatMap"
};

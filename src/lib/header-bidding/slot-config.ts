import type { Advert } from '../../define/Advert';
import type { AdSize } from '../../lib/ad-sizes';
import { adSizes, createAdSize } from '../../lib/ad-sizes';
import { isInUk } from '../../lib/geo/geo-utils';
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

const getSlots = (): HeaderBiddingSizeMapping => {
	const { contentType, hasShowcaseMainElement } = window.guardian.config.page;
	const isArticle = contentType === 'Article';
	const isCrossword = contentType === 'Crossword';
	const hasExtendedMostPop =
		isArticle && window.guardian.config.switches.extendedMostPopular;

	return {
		right: {
			desktop: hasShowcaseMainElement
				? [adSizes.mpu]
				: [adSizes.halfPage, adSizes.mpu],
			tablet: hasShowcaseMainElement
				? [adSizes.mpu]
				: [adSizes.halfPage, adSizes.mpu],
			mobile: hasShowcaseMainElement
				? [adSizes.mpu]
				: [adSizes.halfPage, adSizes.mpu],
		},
		'top-above-nav': {
			desktop: [adSizes.billboard, adSizes.leaderboard],
			tablet: [adSizes.leaderboard],
			mobile: [adSizes.mpu],
		},
		'fronts-banner': {
			desktop: [adSizes.billboard],
		},
		inline: {
			desktop: isArticle
				? [adSizes.skyscraper, adSizes.halfPage, adSizes.mpu]
				: [adSizes.mpu],
			tablet: [adSizes.mpu],
			mobile: [adSizes.mpu],
		},
		inline1: {
			desktop: isArticle
				? [adSizes.mpu, adSizes.outstreamDesktop]
				: [adSizes.mpu],
			tablet: isArticle
				? [adSizes.mpu, adSizes.outstreamDesktop]
				: [adSizes.mpu],
			mobile: isArticle
				? [
						adSizes.outstreamMobile,
						adSizes.mpu,
						adSizes.portraitInterstitial,
					]
				: [adSizes.mpu],
		},
		inline2: {
			desktop: isArticle
				? [adSizes.skyscraper, adSizes.halfPage, adSizes.mpu]
				: [adSizes.mpu],
			tablet: [adSizes.mpu],
			mobile: isArticle
				? [
						adSizes.mpu,
						adSizes.portraitInterstitial,
						adSizes.pubmaticInterscroller,
					]
				: [adSizes.mpu],
		},
		mostpop: {
			desktop: hasExtendedMostPop
				? [adSizes.halfPage, adSizes.mpu]
				: [adSizes.mpu],
			tablet: hasExtendedMostPop
				? [adSizes.halfPage, adSizes.mpu, adSizes.leaderboard]
				: [adSizes.mpu],
			mobile: [adSizes.mpu],
		},
		comments: {
			desktop: [adSizes.skyscraper, adSizes.mpu, adSizes.halfPage],
		},
		'comments-expanded': {
			desktop: [adSizes.skyscraper, adSizes.mpu, adSizes.halfPage],
		},
		banner: {
			// Banner slots appear on interactives, like on
			// https://www.theguardian.com/us-news/ng-interactive/2018/nov/06/midterm-elections-2018-live-results-latest-winners-and-seats
			desktop: [
				createAdSize(88, 70),
				adSizes.leaderboard,
				adSizes.cascade,
				createAdSize(900, 250),
				adSizes.billboard,
			],
		},
		'mobile-sticky': {
			mobile: shouldIncludeMobileSticky()
				? [adSizes.mobilesticky, createAdSize(300, 50)]
				: [],
		},
		'crossword-banner': {
			desktop: isCrossword ? [adSizes.leaderboard] : [],
			tablet: isCrossword ? [adSizes.leaderboard] : [],
		},
		'crossword-banner-mobile': {
			mobile: [adSizes.mobilesticky],
		},
		'football-right': {
			desktop: [
				adSizes.empty,
				adSizes.mpu,
				adSizes.skyscraper,
				adSizes.halfPage,
			],
		},
		merchandising: {
			mobile: [adSizes.mpu],
			desktop: [adSizes.billboard],
		},
		'merchandising-high': {
			mobile: [adSizes.mpu],
			desktop: [adSizes.billboard],
		},
		'article-end': {
			mobile: isInUk() ? [adSizes.mpu] : [],
			tablet: isInUk() ? [adSizes.mpu] : [],
			desktop: isInUk() ? [adSizes.mpu] : [],
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

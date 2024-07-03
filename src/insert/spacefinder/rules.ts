import { adSizes } from 'core';
import { adSlotContainerClass } from 'core/create-ad-slot';
import { isInVariantSynchronous } from 'experiments/ab';
import { deeplyReadRightColumn } from 'experiments/tests/deeply-read-right-column';
import {
	getCurrentBreakpoint,
	getCurrentTweakpoint,
} from 'lib/detect/detect-breakpoint';
import type { RuleSpacing, SpacefinderRules } from './spacefinder';
import { isInHighValueSection } from './utils';

const articleBodySelector = '.article-body-commercial-selector';

const tweakpoint = getCurrentTweakpoint();
const hasLeftCol = ['leftCol', 'wide'].includes(tweakpoint);

let ignoreList = `:scope > :not(p):not(h2):not(ul):not(.${adSlotContainerClass}):not(#sign-in-gate):not(.sfdebug)`;
if (hasLeftCol) {
	ignoreList +=
		':not([data-spacefinder-role="richLink"]):not([data-spacefinder-role="thumbnail"])';
}

/**
 * As estimation of the height of the most viewed island.
 * This appears from desktop breakpoints on the right-hand side.
 * Knowing the height of the element is useful when
 * calculating where to place ads in the right column.
 */
const MOST_VIEWED_HEIGHT = 600;

const isImmersive = window.guardian.config.page.isImmersive;

const hasImages = !!window.guardian.config.page.lightboxImages?.images.length;
const isPaidContent = window.guardian.config.page.isPaidContent;

const hasShowcaseMainElement =
	window.guardian.config.page.hasShowcaseMainElement;

const isInDeeplyReadMostViewedVariant = isInVariantSynchronous(
	deeplyReadRightColumn,
	'deeply-read-and-most-viewed',
);

const minDistanceBetweenRightRailAds = 500;
const minDistanceBetweenInlineAds = isInHighValueSection ? 500 : 750;

/**
 * Rules to avoid inserting ads in the right rail too close to each other
 **/
const rightRailAdSlotContainerRules: Record<string, RuleSpacing> = {
	[` .${adSlotContainerClass}`]: {
		minAboveSlot: minDistanceBetweenRightRailAds,
		minBelowSlot: minDistanceBetweenRightRailAds,
	},
};

/**
 * Rules to avoid inserting inline ads too close to each other
 **/
const inlineAdSlotContainerRules: Record<string, RuleSpacing> = {
	[` .${adSlotContainerClass}`]: {
		minAboveSlot: minDistanceBetweenInlineAds,
		minBelowSlot: minDistanceBetweenInlineAds,
	},
};

const desktopInline1: SpacefinderRules = {
	bodySelector: articleBodySelector,
	candidateSelector: ':scope > p, [data-spacefinder-role="nested"] > p',
	minAbove: isImmersive ? 700 : 300,
	minBelow: 300,
	opponentSelectorRules: {
		// don't place ads right after a heading
		':scope > h2, [data-spacefinder-role="nested"] > h2': {
			minAboveSlot: isInHighValueSection ? 150 : 5,
			minBelowSlot: isInHighValueSection ? 0 : 190,
		},
		[`.${adSlotContainerClass}`]: {
			minAboveSlot: 500,
			minBelowSlot: 500,
		},
		[ignoreList]: {
			minAboveSlot: 35,
			minBelowSlot: 400,
		},
		'[data-spacefinder-role="immersive"]': {
			minAboveSlot: 0,
			minBelowSlot: 600,
		},

		// frontend only interactives
		'figure.element--supporting': {
			minAboveSlot: 100,
			minBelowSlot: 0,
		},
	},
};

let desktopRightRailMinAbove = 1000;

/**
 * In special cases, inline2 can overlap the "Most viewed" island, so
 * we need to make an adjustment to move the inline2 further down the page
 */
if (isInDeeplyReadMostViewedVariant || isPaidContent) {
	desktopRightRailMinAbove += MOST_VIEWED_HEIGHT;
}

// Some old articles don't have a main image, which means the first paragraph is much higher
if (!hasImages) {
	desktopRightRailMinAbove += 600;
} else if (hasShowcaseMainElement) {
	desktopRightRailMinAbove += 100;
}

const desktopRightRail: SpacefinderRules = {
	bodySelector: articleBodySelector,
	candidateSelector: ':scope > p, [data-spacefinder-role="nested"] > p',
	minAbove: desktopRightRailMinAbove,
	minBelow: 300,
	opponentSelectorRules: {
		...rightRailAdSlotContainerRules,
		'[data-spacefinder-role="immersive"]': {
			minAboveSlot: 0,
			minBelowSlot: 600,
		},
	},
	/**
	 * Filter out any candidates that are too close to the last winner
	 * see https://github.com/guardian/commercial/tree/main/docs/spacefinder#avoiding-other-winning-candidates
	 * for more information
	 **/
	filter: (candidate, lastWinner) => {
		if (!lastWinner) {
			return true;
		}
		const largestSizeForSlot = adSizes.halfPage.height;
		const distanceBetweenAds =
			candidate.top - lastWinner.top - largestSizeForSlot;
		return distanceBetweenAds >= minDistanceBetweenRightRailAds;
	},
};

const mobileMinDistanceFromArticleTop = 200;

const mobileIgnoreList = `:not(p):not(h2):not(hr):not(.${adSlotContainerClass}):not(#sign-in-gate):not([data-spacefinder-type$="NumberedTitleBlockElement"])`;

const mobileOpponentSelectorRules = {
	// don't place ads right after a heading
	':scope > h2, [data-spacefinder-role="nested"] > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"]':
		{
			minAboveSlot: 100,
			minBelowSlot: 0,
		},
	...inlineAdSlotContainerRules,
	// this is a catch-all for elements that are not covered by the above rules, these will generally be things like videos, embeds and atoms. minBelowSlot is higher to push ads a bit further down after these elements
	[`:scope > ${mobileIgnoreList}, [data-spacefinder-role="nested"] > ${mobileIgnoreList}`]:
		{
			minAboveSlot: 35,
			minBelowSlot: 200,
			// Usually we don't want an ad right before videos, embeds and atoms etc. so that we don't break up related content too much. But if we have a heading above, anything above the heading won't be related to the current content, so we can place an ad there.
			bypassMinBelow:
				'h2,[data-spacefinder-type$="NumberedTitleBlockElement"]',
		},
};

const mobileSubsequentInlineAds: SpacefinderRules = {
	bodySelector: articleBodySelector,
	candidateSelector:
		':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p',
	minAbove: mobileMinDistanceFromArticleTop,
	minBelow: 200,
	opponentSelectorRules: mobileOpponentSelectorRules,
	/**
	 * Filter out any candidates that are too close to the last winner
	 * see https://github.com/guardian/commercial/tree/main/docs/spacefinder#avoiding-other-winning-candidates
	 * for more information
	 **/
	filter: (candidate, lastWinner) => {
		if (!lastWinner) {
			return true;
		}
		const distanceBetweenAds = candidate.top - lastWinner.top;
		return distanceBetweenAds >= minDistanceBetweenInlineAds;
	},
};

const mobileTopAboveNav: SpacefinderRules = {
	bodySelector: articleBodySelector,
	candidateSelector:
		':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p',
	minAbove: mobileMinDistanceFromArticleTop,
	minBelow: 200,
	opponentSelectorRules: mobileOpponentSelectorRules,
};

const breakpoint = getCurrentBreakpoint();
const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';

const inlineMerchandising: SpacefinderRules = {
	bodySelector: articleBodySelector,
	candidateSelector: ':scope > p',
	minAbove: 300,
	minBelow: 300,
	opponentSelectorRules: {
		':scope > .merch': {
			minAboveSlot: 0,
			minBelowSlot: 0,
		},
		':scope > header': {
			minAboveSlot: isMobileOrTablet ? 300 : 700,
			minBelowSlot: 0,
		},
		':scope > h2': {
			minAboveSlot: 100,
			minBelowSlot: 250,
		},
		':scope > #sign-in-gate': {
			minAboveSlot: 0,
			minBelowSlot: 400,
		},
		...inlineAdSlotContainerRules,
		[`:scope > :not(p):not(h2):not(.${adSlotContainerClass}):not(#sign-in-gate):not(.sfdebug)`]:
			{
				minAboveSlot: 200,
				minBelowSlot: 400,
			},
	},
};

export const rules = {
	desktopInline1,
	desktopRightRail,
	mobileTopAboveNav,
	mobileSubsequentInlineAds,
	inlineMerchandising,
};

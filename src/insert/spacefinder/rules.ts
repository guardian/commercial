import { adSizes } from 'core';
import { adSlotContainerClass } from 'core/create-ad-slot';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import type { SpacefinderRules } from './spacefinder';
import { isInHighValueSection } from './utils';

const bodySelector = '.article-body-commercial-selector';
const adSlotContainerSelector = `.${adSlotContainerClass}`;

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

const minDistanceBetweenRightRailAds = 500;
const minDistanceBetweenInlineAds = isInHighValueSection ? 500 : 750;

const candidateSelector = ':scope > p, [data-spacefinder-role="nested"] > p';

const rightColumnOpponentSelector = '[data-spacefinder-role="immersive"]';
const inlineOpponentSelector = [
	'inline',
	'supporting',
	'showcase',
	'thumbnail',
	'richLink',
]
	.map((role) => `[data-spacefinder-role="${role}"]`)
	.join(',');

const headingSelector = ':scope > h2, [data-spacefinder-role="nested"] > h2';

const desktopInline1: SpacefinderRules = {
	bodySelector,
	candidateSelector,
	minAbove: isImmersive ? 700 : 300,
	minBelow: 300,
	opponentSelectorRules: {
		// don't place ads right after a heading
		[headingSelector]: {
			minAboveSlot: isInHighValueSection ? 150 : 5,
			minBelowSlot: isInHighValueSection ? 0 : 190,
		},
		[adSlotContainerSelector]: {
			minAboveSlot: 500,
			minBelowSlot: 500,
		},
		[inlineOpponentSelector]: {
			minAboveSlot: 35,
			minBelowSlot: 400,
		},
		[rightColumnOpponentSelector]: {
			minAboveSlot: 0,
			minBelowSlot: 600,
		},
		['[data-spacefinder-role="supporting"]']: {
			minAboveSlot: 0,
			minBelowSlot: 100,
		},
	},
};

const desktopRightRailMinAbove = () => {
	const base = 1000;
	/**
	 * In special cases, inline2 can overlap the "Most viewed" island, so
	 * we need to make an adjustment to move the inline2 further down the page
	 */
	if (isPaidContent || !hasImages) {
		return base + MOST_VIEWED_HEIGHT;
	}

	if (hasShowcaseMainElement) {
		return base + 100;
	}
	return base;
};

const desktopRightRail: SpacefinderRules = {
	bodySelector,
	candidateSelector,
	minAbove: desktopRightRailMinAbove(),
	minBelow: 300,
	opponentSelectorRules: {
		[rightColumnOpponentSelector]: {
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

const mobileCandidateSelector =
	':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p';

const mobileHeadingSelector =
	':scope > h2, [data-spacefinder-role="nested"] > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"]';

const mobileOpponentSelectorRules = {
	// don't place ads right after a heading
	[mobileHeadingSelector]: {
		minAboveSlot: 100,
		minBelowSlot: 0,
	},
	[adSlotContainerSelector]: {
		minAboveSlot: minDistanceBetweenInlineAds,
		minBelowSlot: minDistanceBetweenInlineAds,
	},
	[inlineOpponentSelector]: {
		minAboveSlot: 35,
		minBelowSlot: 200,
		// Usually we don't want an ad right before videos, embeds and atoms etc. so that we don't break up related content too much. But if we have a heading above, anything above the heading won't be related to the current content, so we can place an ad there.
		bypassMinBelow:
			'h2,[data-spacefinder-type$="NumberedTitleBlockElement"]',
	},
	[rightColumnOpponentSelector]: {
		minAboveSlot: 35,
		minBelowSlot: 200,
		// Usually we don't want an ad right before videos, embeds and atoms etc. so that we don't break up related content too much. But if we have a heading above, anything above the heading won't be related to the current content, so we can place an ad there.
		bypassMinBelow:
			'h2,[data-spacefinder-type$="NumberedTitleBlockElement"]',
	},
};

const mobileSubsequentInlineAds: SpacefinderRules = {
	bodySelector,
	candidateSelector: mobileCandidateSelector,
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
	bodySelector,
	candidateSelector: mobileCandidateSelector,
	minAbove: mobileMinDistanceFromArticleTop,
	minBelow: 200,
	opponentSelectorRules: mobileOpponentSelectorRules,
};

const breakpoint = getCurrentBreakpoint();
const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';

const inlineMerchandising: SpacefinderRules = {
	bodySelector,
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
		[adSlotContainerSelector]: {
			minAboveSlot: minDistanceBetweenInlineAds,
			minBelowSlot: minDistanceBetweenInlineAds,
		},
		[inlineOpponentSelector]: {
			minAboveSlot: 200,
			minBelowSlot: 400,
		},
		[rightColumnOpponentSelector]: {
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

import type { AdSize, SizeMapping } from 'core/ad-sizes';
import { adSizes } from 'core/ad-sizes';
import type { ContainerOptions } from 'core/create-ad-slot';
import {
	adSlotContainerClass,
	createAdSlot,
	wrapSlotInContainer,
} from 'core/create-ad-slot';
import { spaceFiller } from 'insert/spacefinder/space-filler';
import type {
	RuleSpacing,
	SpacefinderRules,
	SpacefinderWriter,
} from 'insert/spacefinder/spacefinder';
import { commercialFeatures } from 'lib/commercial-features';
import {
	getCurrentBreakpoint,
	getCurrentTweakpoint,
} from 'lib/detect/detect-breakpoint';
import { isInVariantSynchronous } from '../../experiments/ab';
import { deeplyReadRightColumn } from '../../experiments/tests/deeply-read-right-column';
import { waitForAdvert } from '../../lib/dfp/wait-for-advert';
import fastdom from '../../utils/fastdom-promise';
import { computeStickyHeights, insertHeightStyles } from '../sticky-inlines';
import { initCarrot } from './carrot-traffic-driver';
import { isInHighValueSection } from './utils';

type SlotName = Parameters<typeof createAdSlot>[0];

/**
 * As estimation of the height of the most viewed island.
 * This appears from desktop breakpoints on the right-hand side.
 * Knowing the height of the element is useful when
 * calculating where to place ads in the right column.
 */
const MOST_VIEWED_HEIGHT = 600;

const articleBodySelector = '.article-body-commercial-selector';

const isPaidContent = window.guardian.config.page.isPaidContent;

const hasImages = !!window.guardian.config.page.lightboxImages?.images.length;

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

/**
 * Get the classname for an ad slot container
 *
 * We add 2 to the index because these are always ads added in the second pass.
 *
 * e.g. the 0th container inserted in pass 2 will have suffix `-2` to match `inline2`
 *
 * @param i Index of winning paragraph
 * @returns The classname for container
 */
const getStickyContainerClassname = (i: number) =>
	`${adSlotContainerClass}-${i + 2}`;

const insertSlotAtPara = async (
	para: Node,
	name: string,
	type: SlotName,
	classes?: string,
	containerOptions: ContainerOptions = {},
): Promise<HTMLElement> => {
	const ad = createAdSlot(type, {
		name,
		classes,
	});

	const node = wrapSlotInContainer(ad, containerOptions);

	await fastdom.mutate(() => {
		if (para.parentNode) {
			para.parentNode.insertBefore(node, para);
		}
	});

	return ad;
};

type FillAdSlot = (
	name: string,
	slot: HTMLElement,
	/* additional sizes to be added to the slot (used only by googletag) */
	additionalSizes?: SizeMapping,
) => Promise<void>;

/**
 * Decide whether we have enough space to add additional sizes for a given advert.
 * This function ensures we don't insert large height ads at the bottom of articles,
 * when there's not enough room.
 *
 * This prevents adverts at the bottom of articles pushing down content.
 */
const decideAdditionalSizes = async (
	winningPara: HTMLElement,
	sizes: AdSize[],
	isLastInline: boolean,
): Promise<AdSize[]> => {
	// If this ad isn't the last inline then return all additional sizes
	if (!isLastInline) {
		return sizes;
	}

	// Compute the vertical distance from the TOP of the winning para to the BOTTOM of the article body
	const distanceFromBottom = await fastdom.measure(() => {
		const paraTop = winningPara.getBoundingClientRect().top;
		const articleBodyBottom = document
			.querySelector<HTMLElement>(articleBodySelector)
			?.getBoundingClientRect().bottom;

		return articleBodyBottom
			? Math.abs(paraTop - articleBodyBottom)
			: undefined;
	});

	// Return all of the sizes that will fit in the distance to bottom
	return sizes.filter((adSize) =>
		distanceFromBottom ? distanceFromBottom >= adSize.height : false,
	);
};

const addDesktopInline1 = (fillSlot: FillAdSlot): Promise<boolean> => {
	const tweakpoint = getCurrentTweakpoint();
	const hasLeftCol = ['leftCol', 'wide'].includes(tweakpoint);

	let ignoreList = `:scope > :not(p):not(h2):not(ul):not(.${adSlotContainerClass}):not(#sign-in-gate):not(.sfdebug)`;
	if (hasLeftCol) {
		ignoreList +=
			':not([data-spacefinder-role="richLink"]):not([data-spacefinder-role="thumbnail"])';
	}

	const isImmersive = window.guardian.config.page.isImmersive;

	const rules: SpacefinderRules = {
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
			'figure.element--supporting': {
				minAboveSlot: 100,
				minBelowSlot: 0,
			},
		},
	};

	// these are added here and not in size mappings because the inline[i] name
	// is also used on fronts, where we don't want outstream or tall ads
	const additionalSizes = {
		phablet: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
		desktop: [adSizes.outstreamDesktop, adSizes.outstreamGoogleDesktop],
	};

	const insertAd: SpacefinderWriter = async (paras) => {
		const slots = paras.slice(0, 1).map(async (para) => {
			const name = 'inline1';
			const slot = await insertSlotAtPara(para, name, 'inline', 'inline');
			await fillSlot(name, slot, additionalSizes);
		});

		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAd, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'inline1',
	});
};

/**
 * Inserts all inline ads on desktop except for inline1.
 */
const addDesktopRightRailAds = (fillSlot: FillAdSlot): Promise<boolean> => {
	let minAbove = 1000;

	/**
	 * In special cases, inline2 can overlap the "Most viewed" island, so
	 * we need to make an adjustment to move the inline2 further down the page
	 */
	if (isInDeeplyReadMostViewedVariant || isPaidContent) {
		minAbove += MOST_VIEWED_HEIGHT;
	}

	// Some old articles don't have a main image, which means the first paragraph is much higher
	if (!hasImages) {
		minAbove += 600;
	} else if (hasShowcaseMainElement) {
		minAbove += 100;
	}

	const largestSizeForSlot = adSizes.halfPage.height;
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		candidateSelector: ':scope > p, [data-spacefinder-role="nested"] > p',
		minAbove,
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
			const distanceBetweenAds =
				candidate.top - lastWinner.top - largestSizeForSlot;
			return distanceBetweenAds >= minDistanceBetweenRightRailAds;
		},
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		const stickyContainerHeights = await computeStickyHeights(
			paras,
			articleBodySelector,
		);

		void insertHeightStyles(
			stickyContainerHeights.map((height, index) => [
				getStickyContainerClassname(index),
				height,
			]),
		);

		const slots = paras.slice(0, paras.length).map(async (para, i) => {
			const isLastInline = i === paras.length - 1;

			const containerClasses =
				getStickyContainerClassname(i) +
				' offset-right ad-slot--offset-right ad-slot-container--offset-right';

			const containerOptions = {
				sticky: true,
				className: containerClasses,
			};

			// these are added here and not in size mappings because the inline[i] name
			// is also used on fronts, where we don't want outstream or tall ads
			const additionalSizes = {
				desktop: await decideAdditionalSizes(
					para,
					[adSizes.halfPage, adSizes.skyscraper],
					isLastInline,
				),
			};

			const slot = await insertSlotAtPara(
				para,
				`inline${i + 2}`,
				'inline',
				'inline',
				containerOptions,
			);

			return fillSlot(`inline${i + 2}`, slot, additionalSizes);
		});

		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'subsequent-inlines',
	});
};

const mobileMinDistanceFromArticleTop = 250;

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

const addMobileTopAboveNav = (fillSlot: FillAdSlot): Promise<boolean> => {
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		candidateSelector:
			':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p',
		minAbove: mobileMinDistanceFromArticleTop,
		minBelow: 200,
		opponentSelectorRules: mobileOpponentSelectorRules,
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.slice(0, 1).map(async (para) => {
			const name = 'top-above-nav';
			const type = 'top-above-nav';
			const slot = await insertSlotAtPara(para, name, type, 'inline');
			return fillSlot(name, slot);
		});
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'mobile-top-above-nav',
	});
};

const addMobileSubsequentInlineAds = (
	fillSlot: FillAdSlot,
): Promise<boolean> => {
	const rules: SpacefinderRules = {
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

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.map(async (para, i) => {
			const name = `inline${i}`;
			const type = 'inline';
			const slot = await insertSlotAtPara(para, name, type, 'inline');
			return fillSlot(
				name,
				slot,
				// Add the mobile portrait interstitial size to inline1 and inline2
				i == 1 || i == 2
					? {
							mobile: [adSizes.portraitInterstitial],
					  }
					: undefined,
			);
		});
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'mobile-subsequent-inlines',
	});
};

/**
 * Add inline slots to the article body
 * @param fillSlot A function to call that will fill the slot when each ad slot has been inserted,
 * these could be google display ads or opt opt consentless ads.
 */
const addFirstInlineAd = (fillSlot: FillAdSlot): Promise<boolean> => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	if (isMobile) {
		return addMobileTopAboveNav(fillSlot);
	}

	if (isPaidContent) {
		return Promise.resolve(false);
	}

	return addDesktopInline1(fillSlot);
};

const addSubsequentInlineAds = (fillSlot: FillAdSlot): Promise<boolean> => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	if (isMobile) {
		return addMobileSubsequentInlineAds(fillSlot);
	}

	return addDesktopRightRailAds(fillSlot);
};

const attemptToAddInlineMerchAd = (
	fillAdSlot: FillAdSlot,
): Promise<boolean> => {
	const breakpoint = getCurrentBreakpoint();
	const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';

	const rules: SpacefinderRules = {
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

	const insertAds: SpacefinderWriter = async (paras) => {
		if (typeof paras[0] === 'undefined') {
			throw new Error(
				'Trying to insert inline merch before a node that does not exist',
			);
		}
		const slot = await insertSlotAtPara(paras[0], 'im', 'im', '', {
			className: 'ad-slot-container--im',
		});

		await fillAdSlot('im', slot);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'im',
	});
};

/**
 * Init all the article body adverts, including `im` and `carrot`
 * @param fillAdSlot a function to fill the ad slots
 */
const init = async (fillAdSlot: FillAdSlot): Promise<boolean> => {
	if (!commercialFeatures.articleBodyAdverts) {
		return Promise.resolve(false);
	}

	// We add the first inline ad before finding a place for an im so that the inline1 doesn't get pushed down
	await addFirstInlineAd(fillAdSlot);

	const im = window.guardian.config.page.hasInlineMerchandise
		? attemptToAddInlineMerchAd(fillAdSlot)
		: Promise.resolve(false);
	const inlineMerchAdded = await im;
	if (inlineMerchAdded) await waitForAdvert('dfp-ad--im');

	// Add the other inline slots after the im, so that there is space left for the im ad
	await addSubsequentInlineAds(fillAdSlot);

	await initCarrot();

	return im;
};

export { init, addFirstInlineAd, addSubsequentInlineAds, type FillAdSlot };

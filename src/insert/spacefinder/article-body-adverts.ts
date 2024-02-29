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
	SpacefinderItem,
	SpacefinderRules,
	SpacefinderWriter,
} from 'insert/spacefinder/spacefinder';
import { commercialFeatures } from 'lib/commercial-features';
import {
	getCurrentBreakpoint,
	getCurrentTweakpoint,
} from 'lib/detect/detect-breakpoint';
import { waitForAdvert } from '../../lib/dfp/wait-for-advert';
import fastdom from '../../utils/fastdom-promise';
import { mediator } from '../../utils/mediator';
import { fillDynamicAdSlot } from '../fill-dynamic-advert-slot';
import { computeStickyHeights, insertHeightStyles } from '../sticky-inlines';
import { initCarrot } from './carrot-traffic-driver';

type SlotName = Parameters<typeof createAdSlot>[0];

const articleBodySelector = '.article-body-commercial-selector';

const isPaidContent = window.guardian.config.page.isPaidContent;

const hasImages = !!window.guardian.config.page.lightboxImages?.images.length;

const hasShowcaseMainElement =
	window.guardian.config.page.hasShowcaseMainElement;

const adSlotContainerRules: RuleSpacing = {
	minAboveSlot: 500,
	minBelowSlot: 500,
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

const insertAdAtPara = (
	para: Node,
	name: string,
	type: SlotName,
	classes?: string,
	sizes?: SizeMapping,
	containerOptions: ContainerOptions = {},
): Promise<void> => {
	const ad = createAdSlot(type, {
		name,
		classes,
	});

	const node = wrapSlotInContainer(ad, containerOptions);

	return fastdom
		.mutate(() => {
			if (para.parentNode) {
				para.parentNode.insertBefore(node, para);
			}
		})
		.then(async () => {
			const shouldForceDisplay = ['im', 'carrot'].includes(name);
			await fillDynamicAdSlot(ad, shouldForceDisplay, sizes);
		});
};

// this facilitates a second filtering, now taking into account the candidates' position/size relative to the other candidates
const filterNearbyCandidates =
	(maximumAdHeight: number) =>
	(candidate: SpacefinderItem, lastWinner?: SpacefinderItem): boolean => {
		// No previous winner
		if (lastWinner === undefined) return true;

		return (
			Math.abs(candidate.top - lastWinner.top) - maximumAdHeight >=
			adSlotContainerRules.minBelowSlot
		);
	};

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

const addDesktopInline1 = (): Promise<boolean> => {
	const tweakpoint = getCurrentTweakpoint();
	const hasLeftCol = ['leftCol', 'wide'].includes(tweakpoint);

	let ignoreList = ` > :not(p):not(h2):not(ul):not(.${adSlotContainerClass}):not(#sign-in-gate)`;
	if (hasLeftCol) {
		ignoreList +=
			':not([data-spacefinder-role="richLink"]):not([data-spacefinder-role="thumbnail"])';
	}

	const isImmersive = window.guardian.config.page.isImmersive;

	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: isImmersive ? 700 : 300,
		minBelow: 300,
		selectors: {
			' > h2': {
				minAboveSlot: 5,
				minBelowSlot: 190,
			},
			[` .${adSlotContainerClass}`]: adSlotContainerRules,
			[ignoreList]: {
				minAboveSlot: 35,
				minBelowSlot: 400,
			},
			' [data-spacefinder-role="immersive"]': {
				minAboveSlot: 0,
				minBelowSlot: 600,
			},
			' figure.element--supporting': {
				minAboveSlot: 500,
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
			return insertAdAtPara(
				para,
				'inline1',
				'inline',
				'inline',
				additionalSizes,
			);
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
 *
 */
const addDesktopInline2PlusAds = (): Promise<boolean> => {
	let minAbove = 1000;

	/**
	 * In special cases, inline2 can overlap the "Most viewed" island, so
	 * we need to make an adjustment to move the inline2 further down the page.
	 */
	if (isPaidContent) {
		minAbove += 600;
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
		slotSelector: ' > p',
		minAbove,
		minBelow: 300,
		selectors: {
			[` .${adSlotContainerClass}`]: adSlotContainerRules,
			' [data-spacefinder-role="immersive"]': {
				minAboveSlot: 0,
				minBelowSlot: 600,
			},
		},
		filter: filterNearbyCandidates(largestSizeForSlot),
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

			return insertAdAtPara(
				para,
				`inline${i + 2}`,
				'inline',
				'inline',
				additionalSizes,
				containerOptions,
			);
		});

		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'subsequent-inlines',
	});
};

const addMobileInlineAds = (): Promise<boolean> => {
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p,hr,h2',
		minAbove: 200,
		minBelow: 200,
		selectors: {
			' > h2': {
				minAboveSlot: 0,
				minBelowSlot: 250,
			},
			[` .${adSlotContainerClass}`]: adSlotContainerRules,
			// rich links are floated so give them a wide berth
			[` > [data-spacefinder-role="richLink"]`]: {
				minAboveSlot: 200,
				minBelowSlot: 50,
			},
			// this is a catch-all for elements that are not covered by the above rules, these will generally be things like videos, embeds and atoms. minAboveSlot is higher to push ads a bit further down after these elements
			[` > :not(p):not(h2):not(hr):not(.${adSlotContainerClass}):not(#sign-in-gate):not([data-spacefinder-type$="NumberedTitleBlockElement"])`]:
				{
					minAboveSlot: 100,
					minBelowSlot: 20,
				},
		},
		filter: filterNearbyCandidates(adSizes.mpu.height),
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.map((para, i) =>
			insertAdAtPara(
				para,
				i === 0 ? 'top-above-nav' : `inline${i}`,
				i === 0 ? 'top-above-nav' : 'inline',
				'inline',
				// Add the mobile portrait interstitial size to inline1 and inline2
				i == 1 || i == 2
					? {
							mobile: [adSizes.portraitInterstitial],
					  }
					: undefined,
			),
		);
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'mobile-inlines',
	});
};

const addInlineAds = (): Promise<boolean> => {
	const isMobile = getCurrentBreakpoint() === 'mobile';
	if (isMobile) {
		return addMobileInlineAds();
	}

	if (isPaidContent) {
		return addDesktopInline2PlusAds();
	}

	// Add the rest of the inline ad slots after a position for inline1 has been found.
	// We don't wan't inline1 and inline2 targeting the same paragraph.
	return addDesktopInline1().then(() => addDesktopInline2PlusAds());
};

const attemptToAddInlineMerchAd = (): Promise<boolean> => {
	const breakpoint = getCurrentBreakpoint();
	const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';

	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelector: ' > p',
		minAbove: 300,
		minBelow: 300,
		selectors: {
			' > .merch': {
				minAboveSlot: 0,
				minBelowSlot: 0,
			},
			' > header': {
				minAboveSlot: isMobileOrTablet ? 300 : 700,
				minBelowSlot: 0,
			},
			' > h2': {
				minAboveSlot: 100,
				minBelowSlot: 250,
			},
			[` .${adSlotContainerClass}`]: adSlotContainerRules,
			[` > :not(p):not(h2):not(.${adSlotContainerClass}):not(#sign-in-gate)`]:
				{
					minAboveSlot: 200,
					minBelowSlot: 400,
				},
		},
	};

	const insertAds: SpacefinderWriter = (paras) => {
		if (typeof paras[0] === 'undefined') {
			throw new Error(
				'Trying to insert inline merch before a node that does not exist',
			);
		}
		return insertAdAtPara(
			paras[0],
			'im',
			'im',
			'',
			{},
			{
				className: 'ad-slot-container--im',
			},
		);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'im',
	});
};

const doInit = async (): Promise<boolean> => {
	if (!commercialFeatures.articleBodyAdverts) {
		return Promise.resolve(false);
	}

	const im = window.guardian.config.page.hasInlineMerchandise
		? attemptToAddInlineMerchAd()
		: Promise.resolve(false);
	const inlineMerchAdded = await im;
	if (inlineMerchAdded) await waitForAdvert('dfp-ad--im');
	await addInlineAds();
	await initCarrot();

	return im;
};

/**
 * Initialise article body ad slots
 */
export const init = (): Promise<boolean> => {
	// Also init when the main article is redisplayed
	// For instance by the signin gate.
	mediator.on('page:article:redisplayed', doInit);
	// DCR doesn't have mediator, so listen for CustomEvent
	document.addEventListener('article:sign-in-gate-dismissed', () => {
		void doInit();
	});
	return doInit();
};

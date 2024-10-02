import type { AdSize, SizeMapping } from 'core/ad-sizes';
import { adSizes } from 'core/ad-sizes';
import type { ContainerOptions } from 'core/create-ad-slot';
import {
	adSlotContainerClass,
	createAdSlot,
	wrapSlotInContainer,
} from 'core/create-ad-slot';
import { spaceFiller } from 'insert/spacefinder/space-filler';
import type { SpacefinderWriter } from 'insert/spacefinder/spacefinder';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import fastdom from '../../utils/fastdom-promise';
import { computeStickyHeights, insertHeightStyles } from '../sticky-inlines';
import { initCarrot } from './carrot-traffic-driver';
import { rules } from './rules';

type SlotName = Parameters<typeof createAdSlot>[0];

const articleBodySelector = '.article-body-commercial-selector';

const isPaidContent = window.guardian.config.page.isPaidContent;

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

	return spaceFiller.fillSpace(rules.desktopInline1, insertAd, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'inline1',
	});
};

/**
 * Inserts all inline ads on desktop except for inline1.
 */
const addDesktopRightRailAds = (
	fillSlot: FillAdSlot,
	isConsentless: boolean,
): Promise<boolean> => {
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

	return spaceFiller.fillSpace(
		rules.desktopRightRail(isConsentless),
		insertAds,
		{
			waitForImages: true,
			waitForInteractives: true,
			pass: 'subsequent-inlines',
		},
	);
};

const additionalMobileAndTabletInlineSizes = (index: number) => {
	if (index === 1) {
		return {
			mobile: [adSizes.portraitInterstitial],
		};
	} else if (index === 2) {
		return {
			mobile: [
				adSizes.portraitInterstitial,
				adSizes.pubmaticInterscroller,
			],
		};
	}
	return undefined;
};

const addMobileAndTabletInlineAds = (
	fillSlot: FillAdSlot,
	currentBreakpoint: ReturnType<typeof getCurrentBreakpoint>,
): Promise<boolean> => {
	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.map(async (para, i) => {
			const name =
				currentBreakpoint === 'mobile' && i === 0
					? 'top-above-nav'
					: `inline${i}`;
			const type =
				currentBreakpoint === 'mobile' && i === 0
					? 'top-above-nav'
					: 'inline';
			const slot = await insertSlotAtPara(para, name, type, 'inline');
			return fillSlot(
				name,
				slot,
				additionalMobileAndTabletInlineSizes(i),
			);
		});
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules.mobileAndTabletInlines, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'mobile-inlines',
	});
};

/**
 * Add inline slots to the article body
 * @param fillSlot A function to call that will fill the slot when each ad slot has been inserted,
 * these could be google display ads or opt opt consentless ads.
 */
const addInlineAds = (
	fillSlot: FillAdSlot,
	isConsentless: boolean,
): Promise<boolean> => {
	const currentBreakpoint = getCurrentBreakpoint();
	if (['mobile', 'tablet'].includes(currentBreakpoint)) {
		return addMobileAndTabletInlineAds(fillSlot, currentBreakpoint);
	}

	if (isPaidContent) {
		return addDesktopRightRailAds(fillSlot, isConsentless);
	}

	return addDesktopInline1(fillSlot).then(() =>
		addDesktopRightRailAds(fillSlot, isConsentless),
	);
};

/**
 * Init all the article body adverts, including `carrot`
 * @param fillAdSlot a function to fill the ad slots
 */
const init = async (fillAdSlot: FillAdSlot): Promise<void> => {
	if (!commercialFeatures.articleBodyAdverts) {
		return Promise.resolve();
	}

	await addInlineAds(fillAdSlot, false);

	await initCarrot();
};

export { init, addInlineAds, type FillAdSlot };

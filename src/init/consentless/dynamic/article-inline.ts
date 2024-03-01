import { adSizes } from 'core/ad-sizes';
import { createAdSlot } from 'core/create-ad-slot';
import { spaceFiller } from 'insert/spacefinder/space-filler';
import type {
	SpacefinderItem,
	SpacefinderRules,
	SpacefinderWriter,
} from 'insert/spacefinder/spacefinder';
import {
	computeStickyHeights,
	insertHeightStyles,
} from 'insert/sticky-inlines';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentBreakpoint } from 'lib/detect/detect-breakpoint';
import fastdom from 'utils/fastdom-promise';
import { defineSlot } from '../define-slot';

type SlotName = Parameters<typeof createAdSlot>[0];

type ContainerOptions = {
	className?: string;
};

const articleBodySelector = '.article-body-commercial-selector';

const adSlotClassSelectorSizes = {
	minAboveSlot: 500,
	minBelowSlot: 500,
};

/**
 * Get the classname for an ad slot container
 *
 * We add 2 to the index because these are always ads added in the second pass.
 *
 * e.g. the 0th container inserted in pass 2 becomes `ad-slot-container--2` to match `inline2`
 *
 * @param i Index of winning paragraph
 * @returns The classname for container
 */
const getStickyContainerClassname = (i: number) => `ad-slot-container-${i + 2}`;

const wrapSlotInContainer = (
	ad: HTMLElement,
	options: ContainerOptions = {},
) => {
	const container = document.createElement('div');

	container.className = `ad-slot-container ${options.className ?? ''}`;

	container.appendChild(ad);
	return container;
};

const insertAdAtPara = (
	para: Node,
	name: string,
	type: SlotName,
	classes = '',
	containerOptions: ContainerOptions = {},
	inlineId: number,
): Promise<void> => {
	const adSlot = createAdSlot(type, {
		name,
		classes,
	});

	const node = wrapSlotInContainer(adSlot, containerOptions);

	return fastdom
		.mutate(() => {
			if (para.parentNode) {
				para.parentNode.insertBefore(node, para);
			}
		})
		.then(() => {
			defineSlot(
				adSlot,
				name,
				inlineId === 1 ? 'inline' : 'inline-right',
			);
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
			adSlotClassSelectorSizes.minBelowSlot
		);
	};

const addMobileInlineAds = async () => {
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelectors: ' > p',
		minAbove: 200,
		minBelow: 200,
		selectors: {
			' > h2': {
				minAboveSlot: 100,
				minBelowSlot: 250,
			},
			' .ad-slot': adSlotClassSelectorSizes,
			' > :not(p):not(h2):not(.ad-slot):not(#sign-in-gate)': {
				minAboveSlot: 35,
				minBelowSlot: 200,
			},
		},
		filter: filterNearbyCandidates(adSizes.mpu.height),
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		const slots = paras.map((para, i) =>
			insertAdAtPara(
				para,
				`inline${i + 1}`,
				'inline',
				'inline',
				{},
				i + 1,
			),
		);
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'inline1',
	});
};

const addDesktopInlineAds = async () => {
	// For any other inline
	const rules: SpacefinderRules = {
		bodySelector: articleBodySelector,
		slotSelectors: ' > p',
		minAbove: 1000,
		minBelow: 300,
		selectors: {
			' .ad-slot': adSlotClassSelectorSizes,
			' [data-spacefinder-role="immersive"]': {
				minAboveSlot: 0,
				minBelowSlot: 600,
			},
		},
		filter: filterNearbyCandidates(adSizes.halfPage.height),
	};

	const insertAds: SpacefinderWriter = async (paras) => {
		// Compute the height of containers in which ads will remain sticky
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

		const slots = paras.map((para, i) => {
			const inlineId = i + 1;

			let containerClasses = '';

			if (inlineId !== 1) {
				containerClasses +=
					' offset-right ad-slot--offset-right ad-slot-container--offset-right';
			}

			const containerOptions = {
				className: containerClasses,
			};

			return insertAdAtPara(
				para,
				`inline${inlineId}`,
				'inline',
				'inline',
				containerOptions,
				inlineId,
			);
		});
		await Promise.all(slots);
	};

	return spaceFiller.fillSpace(rules, insertAds, {
		waitForImages: true,
		waitForInteractives: true,
		pass: 'inline1',
	});
};

const addInlineAds = (): Promise<boolean | void> =>
	getCurrentBreakpoint() === 'mobile'
		? addMobileInlineAds()
		: addDesktopInlineAds();

const initArticleInline = async (): Promise<void> => {
	// do we need to rerun for the sign-in gate?
	if (!commercialFeatures.articleBodyAdverts) {
		return;
	}

	await addInlineAds();
};

export { initArticleInline };

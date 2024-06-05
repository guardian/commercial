import { breakpoints as sourceBreakpoints } from '@guardian/source-foundations';
import type { AdSize, SizeMapping, SlotName } from 'core/ad-sizes';
import {
	createAdSize,
	findAppliedSizesForBreakpoint,
	slotSizeMappings,
} from 'core/ad-sizes';
import { concatSizeMappings } from 'core/create-ad-slot';
import type { Breakpoint } from 'core/lib/breakpoint';
import fastdom from 'utils/fastdom-promise';
import { breakpointNameToAttribute } from '../lib/breakpoint-name-to-attribute';
import type { HeaderBiddingSize } from '../lib/header-bidding/prebid-types';
import { buildGoogletagSizeMapping, defineSlot } from './define-slot';

const stringToTuple = (size: string): [number, number] => {
	const dimensions = size.split(',', 2).map(Number);

	// Return an outOfPage tuple if the string is not `[number, number]`
	if (
		dimensions.length !== 2 ||
		!dimensions[0] ||
		!dimensions[1] ||
		dimensions.some((n) => isNaN(n))
	) {
		return [0, 0];
	}

	return [dimensions[0], dimensions[1]];
};

/**
 * A breakpoint can have various sizes assigned to it. You can assign either on
 * set of sizes or multiple.
 *
 * One size       - `data-mobile="300,50"`
 * Multiple sizes - `data-mobile="300,50|320,50"`
 */
const createSizeMapping = (attr: string): AdSize[] =>
	attr.split('|').map((size) => createAdSize(...stringToTuple(size)));

/**
 * Extract the ad sizes from the breakpoint data attributes of an ad slot
 *
 * @param advertNode The ad slot HTML element that contains the breakpoint attributes
 * @returns A mapping from the breakpoints supported by the slot to an array of ad sizes
 */
const getSlotSizeMappingsFromDataAttrs = (
	advertNode: HTMLElement,
): SizeMapping =>
	Object.entries(sourceBreakpoints).reduce<Record<string, AdSize[]>>(
		(sizes, [breakpointName]) => {
			const data = advertNode.getAttribute(
				`data-${breakpointNameToAttribute(breakpointName)}`,
			);
			if (data) {
				sizes[breakpointName] = createSizeMapping(data);
			}
			return sizes;
		},
		{},
	);

const isSlotName = (slotName: string): slotName is SlotName => {
	return slotName in slotSizeMappings;
};

const getSlotName = (name: string): SlotName | false => {
	let slotName: string;
	if (name.includes('inline')) {
		slotName = 'inline';
	} else if (name.includes('fronts-banner')) {
		slotName = 'fronts-banner';
	} else if (name.includes('external')) {
		slotName = 'external';
	} else {
		slotName = name;
	}

	if (isSlotName(slotName)) {
		return slotName;
	}

	return false;
};

const getSlotSizeMapping = (name: string): SizeMapping => {
	let slotName: string;
	if (name.includes('inline')) {
		slotName = 'inline';
	} else if (name.includes('fronts-banner')) {
		slotName = 'fronts-banner';
	} else if (name.includes('external')) {
		slotName = 'external';
	} else if (name.includes('comments-expanded')) {
		slotName = 'comments-expanded';
	} else if (name.includes('interactive')) {
		slotName = 'interactive';
	} else {
		slotName = name;
	}

	if (isSlotName(slotName)) {
		return slotSizeMappings[slotName];
	}

	return {};
};

/**
 * Finds the smallest possible known ad size that can fill a slot
 * Useful for minimising CLS.
 */
const findSmallestAdHeightForSlot = (
	slot: SlotName,
	breakpoint: Breakpoint,
): number | null => {
	const sizes = getSlotSizeMapping(slot);
	if (!Object.keys(sizes).length) return null;

	const sizesForBreakpoint = findAppliedSizesForBreakpoint(sizes, breakpoint);
	const heights = sizesForBreakpoint
		.filter((size) => !size.isProxy())
		.map(({ height }) => height);

	if (!heights.length) return null;

	return Math.min(...heights);
};

const isSizeMappingEmpty = (sizeMapping: SizeMapping): boolean => {
	return (
		Object.keys(sizeMapping).length === 0 ||
		Object.entries(sizeMapping).every(([, mapping]) => mapping.length === 0)
	);
};

class Advert {
	id: string;
	node: HTMLElement;
	sizes: SizeMapping;
	headerBiddingSizes: HeaderBiddingSize[] | null = null;
	size: AdSize | 'fluid' | null = null;
	slot: googletag.Slot;
	isEmpty: boolean | null = null;
	isRendered = false;
	shouldRefresh = false;
	whenSlotReady: Promise<void>;
	extraNodeClasses: string[] = [];
	hasPrebidSize = false;
	headerBiddingBidRequest: Promise<unknown> | null = null;
	lineItemId: number | null = null;
	testgroup: string | undefined; //Ozone testgroup property

	constructor(
		adSlotNode: HTMLElement,
		additionalSizeMapping: SizeMapping = {},
		slotTargeting: Record<string, string> = {},
	) {
		this.id = adSlotNode.id;
		this.node = adSlotNode;
		this.sizes = this.generateSizeMapping(additionalSizeMapping);

		const slotDefinition = defineSlot(
			adSlotNode,
			this.sizes,
			slotTargeting,
		);

		this.slot = slotDefinition.slot;
		this.whenSlotReady = slotDefinition.slotReady;
		this.testgroup = slotDefinition.slot.getTargeting('testgroup')[0];
	}

	/**
	 * Call this method once the ad has been rendered, it will set the
	 * `isRendered` flag to true, which is used to determine whether to load
	 * or refresh the ad
	 *
	 * @param isRendered was an advert rendered
	 */
	finishedRendering(isRendered: boolean): void {
		this.isRendered = isRendered;
	}

	/**
	 * Update the "extra" classes for this slot e.g. `ad-slot--outstream`, so that the base classes
	 * like `ad-slot` etc. are never removed
	 *
	 * @param newClasses An array of classes to set on the slot
	 **/
	async updateExtraSlotClasses(...newClasses: string[]): Promise<void> {
		const classesToRemove = this.extraNodeClasses.filter(
			(c) => !newClasses.includes(c),
		);

		await fastdom.mutate(() => {
			this.node.classList.remove(...classesToRemove);
			this.node.classList.add(...newClasses);
		});

		this.extraNodeClasses = newClasses;
	}

	/**
	 * Combine the size mapping from the mappings in commercial-core with
	 * any additional size mappings, if none are found check data-attributes, if still
	 * none are found throws an error
	 *
	 * @param additionalSizeMapping A mapping of breakpoints to ad sizes
	 * @returns A mapping of breakpoints to ad sizes
	 */
	generateSizeMapping(additionalSizeMapping: SizeMapping): SizeMapping {
		// Try to use size mappings defined in core if available
		const defaultSizeMappingForSlot = this.node.dataset.name
			? getSlotSizeMapping(this.node.dataset.name)
			: {};

		// Data attribute size mappings are used in interactives e.g. https://www.theguardian.com/education/ng-interactive/2021/sep/11/the-best-uk-universities-2022-rankings
		const dataAttrSizeMapping = getSlotSizeMappingsFromDataAttrs(this.node);

		let sizeMapping = concatSizeMappings(
			defaultSizeMappingForSlot,
			additionalSizeMapping,
		);

		sizeMapping = concatSizeMappings(sizeMapping, dataAttrSizeMapping);

		// If the size mapping is still empty, throw an error as this should never happen
		if (isSizeMappingEmpty(sizeMapping)) {
			throw new Error(
				`Tried to render ad slot '${
					this.node.dataset.name ?? ''
				}' without any size mappings`,
			);
		}

		return sizeMapping;
	}

	/**
	 * Update the size mapping for this slot, you will need to call
	 * refreshAdvert to update the ad immediately
	 *
	 * @param additionalSizeMapping A mapping of breakpoints to ad sizes
	 **/
	updateSizeMapping(additionalSizeMapping: SizeMapping): void {
		const sizeMapping = this.generateSizeMapping(additionalSizeMapping);

		this.sizes = sizeMapping;

		const googletagSizeMapping = buildGoogletagSizeMapping(sizeMapping);
		if (googletagSizeMapping) {
			this.slot.defineSizeMapping(googletagSizeMapping);
		}
	}
}

const isAdSize = (size: Advert['size']): size is AdSize => {
	return size !== null && size !== 'fluid';
};

export { Advert, findSmallestAdHeightForSlot, isAdSize, getSlotName };

export const _ = {
	getSlotSizeMapping,
};

import { breakpoints as sourceBreakpoints } from '@guardian/source/foundations';
import { once } from 'lodash-es';
import type { AdSize, SizeMapping, SlotName } from '../lib/ad-sizes';
import { EventTimer } from '../lib/event-timer';
import { isEligibleForTeads } from '../lib/targeting/teads-eligibility';
import { getUrlVars } from '../lib/url';
import { initSlotIas } from './init-slot-ias';

const breakpointViewports: Record<keyof SizeMapping, [number, number]> = {
	mobile: [0, 0], // this is width 0 to cover all widths until the next breakpoint if any
	phablet: [sourceBreakpoints.phablet, 0],
	tablet: [sourceBreakpoints.tablet, 0],
	desktop: [sourceBreakpoints.desktop, 0],
	wide: [sourceBreakpoints.wide, 0],
};

const adUnit = once((): string => {
	const urlVars = getUrlVars();
	return urlVars['ad-unit']
		? `/${window.guardian.config.page.dfpAccountId}/${String(
				urlVars['ad-unit'],
			)}`
		: window.guardian.config.page.adUnit;
});

const isBreakpoint = (
	breakpoint: string,
): breakpoint is keyof typeof breakpointViewports =>
	breakpoint in breakpointViewports;

const toGoogleTagSize = (size: AdSize): googletag.SingleSize => {
	// not using width and height here as to maintain compatibility with plain arrays
	return size[0] === 0 && size[1] === 0 ? 'fluid' : [size[0], size[1]];
};

/**
 * Builds a googletag size mapping based on the breakpoints and ad sizes from
 * the defined size mapping and the viewport sizes from source-foundations.
 */
const buildGoogletagSizeMapping = (
	sizeMapping: SizeMapping,
): googletag.SizeMappingArray | null => {
	const mapping = window.googletag.sizeMapping();

	Object.entries(sizeMapping).forEach(([breakpoint, sizes]) => {
		if (isBreakpoint(breakpoint)) {
			mapping.addSize(
				breakpointViewports[breakpoint],
				sizes.map(toGoogleTagSize),
			);
		}
	});

	return mapping.build();
};

const isMultiSize = (
	size: googletag.GeneralSize,
): size is googletag.MultiSize => {
	return Array.isArray(size) && !!size.length;
};

const isSizeInArray = (
	size: googletag.SingleSize,
	sizes: googletag.SingleSize[],
) => {
	if (size === 'fluid') {
		return sizes.includes('fluid');
	} else if (Array.isArray(size)) {
		return !!sizes.find(
			(item) => item[0] === size[0] && item[1] === size[1],
		);
	}
	return false;
};

/**
 * Take all the sizes in a size mapping and reduce to a single array of sizes, for use in `defineSlot`
 *
 * @todo this is possibly redundant as these are only used if a size mapping is not defined which we always provide.
 * @param sizeMapping googletag size mapping
 * @returns all the sizes that were present in the size mapping
 */
const collectSizes = (
	sizeMapping: googletag.SizeMappingArray | null,
): googletag.SingleSize[] => {
	const sizes: googletag.SingleSize[] = [];

	// as we're using sizeMapping, pull out all the ad sizes, as an array of arrays
	sizeMapping?.forEach(([, sizesForBreakpoint]) => {
		if (isMultiSize(sizesForBreakpoint)) {
			sizesForBreakpoint.forEach((size) => {
				if (!isSizeInArray(size, sizes)) {
					sizes.push(size);
				}
			});
		}
	});

	return sizes;
};

const isEligibleForOutstream = (slotTarget: string) =>
	typeof slotTarget === 'string' &&
	(slotTarget === 'inline1' || slotTarget === 'top-above-nav');

const allowSafeFrameToExpand = (slot: googletag.Slot) => {
	slot.setSafeFrameConfig({
		allowOverlayExpansion: false,
		allowPushExpansion: true,
		sandbox: true,
	});

	return slot;
};

const defineSlot = (
	adSlotNode: HTMLElement,
	sizeMapping: SizeMapping,
	slotTargeting: Record<string, string> = {},
): { slot: googletag.Slot; slotReady: Promise<void> } => {
	const slotTarget = adSlotNode.getAttribute('data-name') as SlotName;
	EventTimer.get().mark('defineSlotStart', slotTarget);

	const id = adSlotNode.id;

	const googletagSizeMapping = buildGoogletagSizeMapping(sizeMapping);
	if (!googletagSizeMapping) {
		throw new Error(
			`Could not define slot for ${id}. A googletag size mapping could not be created.`,
		);
	}

	const sizes = collectSizes(googletagSizeMapping);

	let slot: googletag.Slot | null;

	if (adSlotNode.getAttribute('data-out-of-page')) {
		slot = window.googletag.defineOutOfPageSlot(adUnit(), id);
		slot?.defineSizeMapping(googletagSizeMapping);
	} else {
		slot = window.googletag.defineSlot(adUnit(), sizes, id);
		slot?.defineSizeMapping(googletagSizeMapping);

		if (slot && isEligibleForOutstream(slotTarget)) {
			allowSafeFrameToExpand(slot);
		}
	}

	if (!slot) {
		throw new Error(`Could not define slot for ${id}`);
	}

	const slotReady = initSlotIas(id, slot);

	void slotReady.then(() => {
		EventTimer.get().mark('defineSlotEnd', slotTarget);
		EventTimer.get().mark('slotReady', slotTarget);

		// wait until IAS has initialised before checking teads eligibility
		const isTeadsEligible = isEligibleForTeads(id);

		if (isTeadsEligible) {
			slot.setTargeting('teadsEligible', 'true');
		} else {
			slot.setTargeting('teadsEligible', 'false');
		}
	});

	const isbn = window.guardian.config.page.isbn;

	if (slotTarget === isbn) {
		slot.setTargeting('isbn', isbn);
	}

	const fabricKeyValues = new Map<SlotName, string>([
		['top-above-nav', 'fabric1'],
		['merchandising-high', 'fabric2'],
		['merchandising', 'fabric3'],
	]);

	const slotFabric = fabricKeyValues.get(slotTarget);

	if (slotFabric) {
		slot.setTargeting('slot-fabric', slotFabric);
	}

	Object.entries(slotTargeting).forEach(([key, value]) => {
		slot.setTargeting(key, value);
	});

	slot.addService(window.googletag.pubads())
		.setTargeting('slot', slotTarget)
		.setTargeting('testgroup', String(Math.floor(100 * Math.random())));

	return {
		slot,
		slotReady,
	};
};

export { buildGoogletagSizeMapping, collectSizes, defineSlot };

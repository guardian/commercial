import type {
	AdSize,
	SizeMapping,
	SlotName,
} from '@guardian/commercial-core/ad-sizes';
import { EventTimer } from '@guardian/commercial-core/event-timer';
import { isEligibleForTeads } from '@guardian/commercial-core/targeting/teads-eligibility';
import { breakpoints as sourceBreakpoints } from '@guardian/source/foundations';
import { once } from 'lodash-es';
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
 *  Test a known good size mapping, if this fails we can't define slots!
 *  This can happen if googletag has been shimmed by an adblocker
 */
const canDefineSlot = once(() => {
	const testMapping = window.googletag
		.sizeMapping()
		.addSize([0, 0], [[300, 250]])
		.build();
	return !!testMapping;
});

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
	/*
		eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --
		the slot.setConfig function may not exist if googletag has been shimmed by an adblocker
	*/
	slot.setConfig?.({
		safeFrame: {
			allowOverlayExpansion: false,
			allowPushExpansion: true,
			sandbox: true,
		},
	});

	return slot;
};

class DefineSlotError extends Error {
	sizeMapping: string;
	report: boolean;

	constructor(message: string, sizeMapping: SizeMapping, report = true) {
		super(message);
		this.name = 'DefineSlotError';
		this.sizeMapping = JSON.stringify(sizeMapping);
		this.report = report;
	}
}

const defineSlot = (
	adSlotNode: HTMLElement,
	sizeMapping: SizeMapping,
	slotTargeting: Record<string, string> = {},
): { slot: googletag.Slot; slotReady: Promise<void> } => {
	const slotTarget = adSlotNode.getAttribute('data-name') as SlotName;
	EventTimer.get().mark('defineSlotStart', slotTarget);

	const id = adSlotNode.id;

	const { section, contentType } = window.guardian.config.page;

	const googletagSizeMapping = buildGoogletagSizeMapping(sizeMapping);
	if (!googletagSizeMapping) {
		if (canDefineSlot()) {
			throw new DefineSlotError(
				'googletag.sizeMapping did not return a size mapping',
				sizeMapping,
			);
		} else {
			throw new DefineSlotError(
				'Could not define slot. googletag.sizeMapping has been shimmed.',
				sizeMapping,
				false,
			);
		}
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
		throw new DefineSlotError(
			`googletag.defineSlot did not return a slot`,
			sizeMapping,
			false,
		);
	}

	const slotReady = initSlotIas(id, slot, sizes);

	void slotReady.then(() => {
		EventTimer.get().mark('defineSlotEnd', slotTarget);
		EventTimer.get().mark('slotReady', slotTarget);

		// wait until IAS has initialised before checking teads eligibility
		const isTeadsEligible = isEligibleForTeads(id);

		/*
			eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --
			the slot.setConfig function may not exist if googletag has been shimmed by an adblocker
		*/
		slot.setConfig?.({
			targeting: {
				teadsEligible: String(isTeadsEligible),
			},
		});
	});

	/*
		eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --
		the slot.setConfig function may not exist if googletag has been shimmed by an adblocker
	*/
	if (!slot.setConfig) {
		// return early if we can't set targeting
		return {
			slot,
			slotReady,
		};
	}

	const isbn = window.guardian.config.page.isbn;

	if (slotTarget === isbn) {
		slot.setConfig({
			targeting: {
				isbn: isbn,
			},
		});
	}

	const fabricKeyValues = new Map<SlotName, string>([
		['top-above-nav', 'fabric1'],
		['merchandising-high', 'fabric2'],
		['merchandising', 'fabric3'],
	]);

	const slotFabric = fabricKeyValues.get(slotTarget);

	if (slotFabric) {
		slot.setConfig({
			targeting: {
				'slot-fabric': slotFabric,
			},
		});
	}

	Object.entries(slotTargeting).forEach(([key, value]) => {
		slot.setConfig({
			targeting: {
				[key]: value,
			},
		});
	});

	slot.addService(window.googletag.pubads()).setConfig({
		targeting: {
			slot: slotTarget,
			testgroup: String(Math.floor(100 * Math.random())),
			/**
			 * **G**lobal **P**ublisher **ID** – [see on Ad Manager][gam]
			 *
			 * Type: _Dynamic_
			 *
			 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=17382364
			 */
			gpid: `/59666047/gu/${section || 'other'}/${contentType || 'other'}/${slotTarget}`,
		},
	});

	return {
		slot,
		slotReady,
	};
};

export {
	buildGoogletagSizeMapping,
	collectSizes,
	defineSlot,
	canDefineSlot,
	DefineSlotError,
};

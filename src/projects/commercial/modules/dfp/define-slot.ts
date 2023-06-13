import { breakpoints as sourceBreakpoints } from '@guardian/source-foundations';
import { once } from 'lodash-es';
import { EventTimer } from 'core';
import type { SizeMapping, SlotName } from 'core/ad-sizes';
import { SlotEvents } from 'core/event-timer';
import { getUrlVars } from '../../../../lib/url';
import type { IasPETSlot, IasTargeting } from '../../../../types/ias';
import { toGoogleTagSize } from '../../../common/modules/commercial/lib/googletag-ad-size';

const breakpointViewports: Record<keyof SizeMapping, [number, number]> = {
	mobile: [0, 0], // this is width 0 to cover all widths until the next breakpoint if any
	phablet: [sourceBreakpoints.phablet, 0],
	tablet: [sourceBreakpoints.tablet, 0],
	desktop: [sourceBreakpoints.desktop, 0],
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

/**
 * Builds a googletag size mapping based on the breakpoints and ad sizes from
 * the size mapping in commercial-core and the viewport sizes from source-foundations.
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
	EventTimer.get().trigger(SlotEvents.DefineSlotStart, slotTarget);

	const id = adSlotNode.id;

	const googletagSizeMapping = buildGoogletagSizeMapping(sizeMapping);
	if (!googletagSizeMapping) {
		throw new Error(
			`Could not define slot for ${id}. A googletag size mapping could not be created.`,
		);
	}

	const sizes = collectSizes(googletagSizeMapping);

	let slot: googletag.Slot | null;
	let slotReady = Promise.resolve();

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

	/*
        For each ad slot defined, we request information from IAS, based
        on slot name, ad unit and sizes. We then add this targeting to the
        slot prior to requesting it from DFP.

        We create a timer, such that if the timeout resolves before the request
		to IAS returns, then the slot is defined without the additional IAS data.

        To see debugging output from IAS add the URL param `&iasdebug=true` to the page URL
     */
	if (window.guardian.config.switches.iasAdTargeting) {
		// this should all have been instantiated by commercial/modules/third-party-tags/ias.js
		window.__iasPET = window.__iasPET ?? {};
		const iasPET = window.__iasPET;

		iasPET.queue = iasPET.queue ?? [];
		iasPET.pubId = '10249';

		// need to reorganize the type due to https://github.com/microsoft/TypeScript/issues/33591
		const slotSizes: Array<googletag.Size | 'fluid'> = slot.getSizes();

		// IAS Optimization Targeting
		const iasPETSlots: IasPETSlot[] = [
			{
				adSlotId: id,
				size: slotSizes
					.filter(
						(
							size: 'fluid' | googletag.Size,
						): size is googletag.Size => size !== 'fluid',
					)
					.map((size) => [size.getWidth(), size.getHeight()]),
				adUnitPath: adUnit(), // why do we have this method and not just slot.getAdUnitPath()?
			},
		];

		// this is stored so that the timeout can be cancelled in the event of IAS not timing out
		let timeoutId: NodeJS.Timeout;

		// this is resolved by either the iasTimeout or iasDataCallback, defined below
		let loadedResolve: () => void;
		const iasDataPromise = new Promise<void>((resolve) => {
			loadedResolve = resolve;
		});

		const iasDataCallback = (targetingJSON: string) => {
			clearTimeout(timeoutId);

			/*  There is a name-clash with the `fr` targeting returned by IAS
                and the `fr` paramater we already use for frequency. Therefore
                we apply the targeting to the slot ourselves and rename the IAS
                fr parameter to `fra` (given that, here, it relates to fraud).
            */
			const targeting = JSON.parse(targetingJSON) as IasTargeting;

			// brand safety is on a page level
			Object.keys(targeting.brandSafety).forEach((key) => {
				const brandSafetyValue = targeting.brandSafety[key];
				if (brandSafetyValue) {
					window.googletag
						.pubads()
						.setTargeting(key, brandSafetyValue);
				}
			});
			if (targeting.fr) {
				window.googletag.pubads().setTargeting('fra', targeting.fr);
			}
			if (targeting.custom?.['ias-kw']) {
				window.googletag
					.pubads()
					.setTargeting('ias-kw', targeting.custom['ias-kw']);
			}

			// viewability targeting is on a slot level
			const ignoredKeys = ['pub'];
			const slotTargeting = targeting.slots[id];

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO TS can't deduce that this could be undefined
			if (slotTargeting) {
				Object.keys(slotTargeting)
					.filter((x) => !ignoredKeys.includes(x))
					.forEach((key) => {
						const targetingSlot = targeting.slots[id];
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO TS can't deduce that this could be undefined
						if (targetingSlot) {
							const targetingValue = targetingSlot[key];
							// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- TODO TS can't deduce that this could be undefined
							if (slot && targetingValue) {
								slot.setTargeting(key, targetingValue);
							}
						}
					});
			}

			loadedResolve();
		};

		iasPET.queue.push({
			adSlots: iasPETSlots,
			dataHandler: iasDataCallback,
		});

		const iasTimeoutDuration = 1000;

		const iasTimeout = () =>
			new Promise<void>((resolve) => {
				timeoutId = setTimeout(resolve, iasTimeoutDuration);
			});

		slotReady = Promise.race([iasTimeout(), iasDataPromise]);

		void slotReady.then(() => {
			EventTimer.get().trigger(SlotEvents.DefineSlotEnd, slotTarget);
		});
	}

	const isbn = window.guardian.config.page.isbn;

	if (slotTarget === 'im' && isbn) {
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
		slot?.setTargeting(key, value);
	});

	slot.addService(window.googletag.pubads()).setTargeting('slot', slotTarget);

	return {
		slot,
		slotReady,
	};
};

export { buildGoogletagSizeMapping, collectSizes, defineSlot };

import {
	createAdSize,
	findAppliedSizesForBreakpoint,
	slotSizeMappings,
} from '@guardian/commercial-core/ad-sizes';
import type {
	AdSize,
	SizeMapping,
	SlotName,
} from '@guardian/commercial-core/ad-sizes';
import type { Breakpoint } from '@guardian/commercial-core/breakpoint';
import {
	type AdvertStatus,
	type Advert as IAdvert,
} from '@guardian/commercial-core/types';
import { breakpoints as sourceBreakpoints } from '@guardian/source/foundations';
import { concatSizeMappings } from '../lib/create-ad-slot';
import fastdom from '../lib/fastdom-promise';
import type { HeaderBiddingSize } from '../lib/header-bidding/prebid-types';
import { buildGoogletagSizeMapping, defineSlot } from './define-slot';

const advertStatuses: AdvertStatus[] = [
	'ready',
	'preparing',
	'prepared',
	'fetching',
	'fetched',
	'loading',
	'loaded',
	'rendered',
] as const;

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
 * Convert a breakpoint name to a form suitable for use as an attribute
 * Regex matches a lowercase letter followed by an uppercase letter
 *
 * e.g. `mobileLandscape` => `mobile-landscape`
 */
const breakpointNameToAttribute = (breakpointName: string): string =>
	breakpointName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

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

class Advert extends EventTarget implements IAdvert {
	id: string;
	node: HTMLElement;
	sizes: SizeMapping;
	headerBiddingSizes: HeaderBiddingSize[] | null = null;
	size: AdSize | 'fluid' | null = null;
	slot: googletag.Slot;
	gpid: string | undefined;
	isEmpty: boolean | null = null;
	isRendered = false;
	shouldRefresh = false;
	whenSlotReady: Promise<void>;
	extraNodeClasses: string[] = [];
	hasPrebidSize = false;
	headerBiddingBidRequest: Promise<unknown> | null = null;
	lineItemId: number | null = null;
	creativeId: number | null = null;
	creativeTemplateId: number | null = null;
	testgroup: string | undefined; //Ozone testgroup property

	private _status: AdvertStatus = 'ready';

	/**
	 * The status of the advert, which can be one of the following:
	 * - `ready`: The advert has been created but not yet prepared
	 * - `preparing`: The advert is in the process of being prepared, e.g. size mapping is being generated, header bidding bids are being requested etc.
	 * - `prepared`: The advert has been prepared and is ready to be fetched
	 * - `fetching`: The advert is in the process of being fetched, e.g. the GPT fetch command has been called but the slot has not yet received a response
	 * - `fetched`: The advert has been fetched and has received a response from GPT, but it has not yet started loading
	 * - `loading`: The advert is in the process of loading, e.g. the creative is being loaded but has not yet finished
	 * - `loaded`: The advert has finished loading but has not yet rendered, e.g. the creative has loaded but the GPT render command has not yet been called or has been called but the creative has not yet rendered
	 * - `rendered`: The advert has finished rendering and is visible on the page
	 */
	get status(): AdvertStatus {
		return this._status;
	}
	set status(newStatus: AdvertStatus) {
		const currentStatusIndex = advertStatuses.indexOf(this._status);
		const newStatusIndex = advertStatuses.indexOf(newStatus);

		if (newStatusIndex === -1) {
			throw new Error(`Invalid status: ${newStatus}`);
		}

		// Prevent status from being set to an earlier status in the lifecycle, except for the specific case of going from 'rendered' back to 'ready' which will happen when an ad is refreshed
		if (
			newStatusIndex < currentStatusIndex &&
			!(newStatus === 'ready' && this._status === 'rendered')
		) {
			throw new Error(
				`Cannot change status from ${this._status} to ${newStatus}`,
			);
		}

		this._status = newStatus;
		this.dispatchEvent(
			new CustomEvent('statusChange', { detail: newStatus }),
		);
	}

	constructor(
		adSlotNode: HTMLElement,
		additionalSizeMapping: SizeMapping = {},
		slotTargeting: Record<string, string> = {},
	) {
		super();
		this.id = adSlotNode.id;
		this.node = adSlotNode;
		this.sizes = this.generateSizeMapping(additionalSizeMapping);

		const slotDefinition = defineSlot(
			adSlotNode,
			this.sizes,
			slotTargeting,
		);

		const targetingConfig =
			/*
				eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --
				the slot.getConfig function may not exist if googletag has been shimmed by an adblocker
			*/
			slotDefinition.slot.getConfig?.('targeting').targeting;

		this.slot = slotDefinition.slot;
		this.whenSlotReady = slotDefinition.slotReady;

		// Extract targeting values, handling both string and string[] types
		const testgroupValue = targetingConfig?.testgroup;
		this.testgroup = Array.isArray(testgroupValue)
			? testgroupValue[0]
			: (testgroupValue ?? undefined);

		const gpidValue = targetingConfig?.gpid;
		this.gpid = Array.isArray(gpidValue)
			? gpidValue[0]
			: (gpidValue ?? undefined);
	}

	/**
	 * Listen for a status or statuses in the advert lifecycle. The callback will be called once when the advert reaches the specified status, or immediately if the advert has already reached that status.
	 *
	 * @param status A status or array of statuses in the advert lifecycle to listen for
	 * @param callback A callback function that will be called with the status when the advert reaches it
	 * @returns A function that can be called to stop listening for the specified status or statuses
	 */
	on<
		ListenStatus extends AdvertStatus,
		ListenStatuses extends ListenStatus[],
	>(
		status: ListenStatus | ListenStatuses,
		callback: (status: ListenStatuses[number]) => void,
	): () => void {
		const statusesToListenTo: AdvertStatus[] = Array.isArray(status)
			? status
			: [status];

		// If the advert has already reached any of the specified statuses, call the callback immediately
		if (statusesToListenTo.includes(this._status)) {
			callback(this._status as ListenStatuses[number]);
		}

		const listener = (event: Event): void => {
			const eventStatus = (event as CustomEvent).detail as AdvertStatus;
			if (statusesToListenTo.includes(eventStatus)) {
				callback(eventStatus as ListenStatuses[number]);
			}
		};

		this.addEventListener('statusChange', listener);
		return () => this.removeEventListener('statusChange', listener);
	}

	/**
	 * Listen for a status or statuses in the advert lifecycle, but only call the callback the first time the advert reaches one of the specified statuses. If the advert has already reached any of the specified statuses, the callback will be called immediately.
	 *
	 * @param status A status or array of statuses in the advert lifecycle to listen for
	 * @param callback A callback function that will be called with the status when the advert reaches it
	 * @returns void
	 */
	once<
		ListenStatus extends AdvertStatus,
		ListenStatuses extends ListenStatus[],
	>(
		status: ListenStatus | ListenStatuses,
		callback: (status: ListenStatuses[number]) => void,
	): void {
		const statusesToListenTo: AdvertStatus[] = Array.isArray(status)
			? status
			: [status];

		if (statusesToListenTo.includes(this._status)) {
			callback(this._status as ListenStatuses[number]);
			return;
		}

		const listener = (event: Event): void => {
			const eventStatus = (event as CustomEvent).detail as AdvertStatus;
			if (statusesToListenTo.includes(eventStatus)) {
				callback(eventStatus as ListenStatuses[number]);
				this.removeEventListener('statusChange', listener);
			}
		};

		this.addEventListener('statusChange', listener);
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
	 * Combine the size mapping from the mappings in commercial with
	 * any additional size mappings, if none are found check data-attributes, if still
	 * none are found throws an error
	 *
	 * @param additionalSizeMapping A mapping of breakpoints to ad sizes
	 * @returns A mapping of breakpoints to ad sizes
	 */
	generateSizeMapping(additionalSizeMapping: SizeMapping): SizeMapping {
		// Try to use defined size mappings if available
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

export { Advert, findSmallestAdHeightForSlot, isAdSize };

export const _ = {
	getSlotSizeMapping,
};

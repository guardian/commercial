import type { AdSize, SizeMapping } from './ad-sizes';
import { isBreakpoint, slotSizeMappings } from './ad-sizes';

const adSlotIdPrefix = 'dfp-ad--';

type AdSlotConfig = {
	sizeMappings: SizeMapping;
	label?: boolean;
	refresh?: boolean;
	name?: string;
};

type SlotName =
	| 'im'
	| 'high-merch'
	| 'high-merch-lucky'
	| 'high-merch-paid'
	| 'inline'
	| 'mostpop'
	| 'comments'
	| 'top-above-nav'
	| 'carrot'
	| 'epic'
	| 'mobile-sticky';

type AdSlotConfigs = Record<SlotName, AdSlotConfig>;

type CreateSlotOptions = {
	classes?: string;
	name?: string;
	sizes?: Record<string, AdSize[]>;
};

const adSlotConfigs: AdSlotConfigs = {
	im: {
		label: false,
		refresh: false,
		sizeMappings: slotSizeMappings['im'],
	},
	'high-merch': {
		label: false,
		refresh: false,
		name: 'merchandising-high',
		sizeMappings: slotSizeMappings['merchandising-high'],
	},
	'high-merch-lucky': {
		label: false,
		refresh: false,
		name: 'merchandising-high-lucky',
		sizeMappings: slotSizeMappings['merchandising-high-lucky'],
	},
	'high-merch-paid': {
		label: false,
		refresh: false,
		name: 'merchandising-high',
		sizeMappings: slotSizeMappings['merchandising-high'],
	},
	inline: {
		sizeMappings: slotSizeMappings['inline'],
	},
	mostpop: {
		sizeMappings: slotSizeMappings['mostpop'],
	},
	comments: {
		sizeMappings: slotSizeMappings['comments'],
	},
	'top-above-nav': {
		sizeMappings: slotSizeMappings['top-above-nav'],
	},
	carrot: {
		label: false,
		refresh: false,
		name: 'carrot',
		sizeMappings: slotSizeMappings['merchandising-high'],
	},
	epic: {
		label: false,
		refresh: false,
		name: 'epic',
		sizeMappings: slotSizeMappings['epic'],
	},
	'mobile-sticky': {
		label: true,
		refresh: true,
		name: 'mobile-sticky',
		sizeMappings: slotSizeMappings['mobile-sticky'],
	},
};

/**
  Returns an adSlot HTMLElement which is the main DFP slot.

  Insert that element as siblings at the place you want adverts to appear.

  Note that for the DFP slot to be filled by GTP, you'll have to
  use addSlot from add-slot.js
*/
const createAdSlotElement = (
	name: string,
	attrs: Record<string, string>,
	classes: string[],
): HTMLElement => {
	const id = `${adSlotIdPrefix}${name}`;

	// 3562dc07-78e9-4507-b922-78b979d4c5cb
	if (window.guardian.config?.isDotcomRendering && name === 'top-above-nav') {
		// This is to prevent a problem that appeared with DCR.
		// We are simply making sure that if we are about to
		// introduce dfp-ad--top-above-nav then there isn't already one.
		const node = document.getElementById(id);
		if (node?.parentNode) {
			const pnode = node.parentNode;
			console.log(`warning: cleaning up dom node id: dfp-ad--${name}`);
			pnode.removeChild(node);
		}
	}

	// The 'main' adSlot
	const adSlot = document.createElement('div');
	adSlot.id = id;
	adSlot.className = `js-ad-slot ad-slot ${classes.join(' ')}`;
	adSlot.setAttribute('data-link-name', `ad slot ${name}`);
	adSlot.setAttribute('data-name', name);
	adSlot.setAttribute('aria-hidden', 'true');
	Object.entries(attrs).forEach(([k, v]) => adSlot.setAttribute(k, v));

	return adSlot;
};

/**
 * Split class names and prefix all with ad-slot--${className}
 */
const createClasses = (
	slotName: string,
	classes?: string,
): Array<`ad-slot--${string}`> =>
	[...(classes?.split(' ') ?? []), slotName].map<`ad-slot--${string}`>(
		(className: string) => `ad-slot--${className}`,
	);

/**
 * Given default size mappings and additional size mappings from
 * the createAdSlot options parameter.
 *
 * 1. Check that the options size mappings use known device names
 * 2. If so concat the size mappings
 *
 */
const concatSizeMappings = (
	defaultSizeMappings: SizeMapping,
	optionSizeMappings: SizeMapping = {},
): SizeMapping =>
	Object.entries(optionSizeMappings).reduce<SizeMapping>(
		(sizeMappings, [breakpoint, optionSizes]) => {
			// Only perform concatenation if breakpoint is of the correct type
			if (isBreakpoint(breakpoint)) {
				// Concatenate the option sizes onto any existing sizes present for a given breakpoint
				sizeMappings[breakpoint] = (
					sizeMappings[breakpoint] ?? []
				).concat(optionSizes);
			}
			return sizeMappings;
		},
		{ ...defaultSizeMappings },
	);

/**
 * Convert size mappings to a string that will be added to the ad slot
 * data attributes.
 *
 * e.g. { desktop: [[320,250], [320, 280]] } => { desktop: '320,250|320,280' }
 *
 */
const covertSizeMappingsToStrings = (
	sizeMappings: SizeMapping,
): Record<string, string> =>
	Object.entries(sizeMappings).reduce(
		(
			result: Record<string, string>,
			[device, sizes]: [string, AdSize[]],
		) => {
			result[device] = sizes.join('|');
			return result;
		},
		{},
	);

/**
 * Prefix all object keys with data-${key}
 */
const createDataAttributes = (
	attrs: Record<string, string>,
): Record<`data-${string}`, string> =>
	Object.entries(attrs).reduce(
		(result: Record<string, string>, [key, value]) => {
			result[`data-${key}`] = value;
			return result;
		},
		{},
	);

const createAdSlot = (
	name: SlotName,
	options: CreateSlotOptions = {},
): HTMLElement => {
	const adSlotConfig = adSlotConfigs[name];
	const slotName = options.name ?? adSlotConfig.name ?? name;

	const sizeMappings = concatSizeMappings(
		adSlotConfig.sizeMappings,
		options.sizes,
	);

	const attributes = covertSizeMappingsToStrings(sizeMappings);

	if (adSlotConfig.label === false) {
		attributes.label = 'false';
	}

	if (adSlotConfig.refresh === false) {
		attributes.refresh = 'false';
	}

	return createAdSlotElement(
		slotName,
		createDataAttributes(attributes),
		createClasses(slotName, options.classes),
	);
};

export { createAdSlot, concatSizeMappings };

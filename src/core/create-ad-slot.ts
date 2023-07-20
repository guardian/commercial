import type { SizeMapping } from './ad-sizes';
import { isBreakpoint } from './lib/breakpoint';

const adSlotIdPrefix = 'dfp-ad--';

type AdSlotConfig = {
	label?: boolean;
	refresh?: boolean;
	name?: string;
};

type SlotName =
	| 'carrot'
	| 'comments-expanded'
	| 'comments'
	| 'exclusion'
	| 'fronts-banner'
	| 'high-merch'
	| 'im'
	| 'inline'
	| 'mobile-sticky'
	| 'top-above-nav';

type AdSlotConfigs = Partial<Record<SlotName, AdSlotConfig>>;

type CreateSlotOptions = {
	classes?: string;
	name?: string;
};

const adSlotConfigs: AdSlotConfigs = {
	im: {
		label: false,
		refresh: false,
	},
	'high-merch': {
		label: false,
		refresh: false,
		name: 'merchandising-high',
	},
	carrot: {
		label: false,
		refresh: false,
		name: 'carrot',
	},
	'mobile-sticky': {
		label: true,
		refresh: true,
		name: 'mobile-sticky',
	},
};

type DataAttributes = Record<string, string>;

/**
  Returns an adSlot HTMLElement which is the main DFP slot.

  Insert that element as siblings at the place you want adverts to appear.

  Note that for the DFP slot to be filled by GTP, you'll have to
  use addSlot from add-slot.js
*/
const createAdSlotElement = (
	name: string,
	attrs: DataAttributes,
	classes: string[],
): HTMLElement => {
	const id = `${adSlotIdPrefix}${name}`;

	// 3562dc07-78e9-4507-b922-78b979d4c5cb
	if (window.guardian.config.isDotcomRendering && name === 'top-above-nav') {
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
	adSlot.dataset.linkName = `ad slot ${name}`;
	adSlot.dataset.name = name;
	adSlot.setAttribute('aria-hidden', 'true');
	Object.entries(attrs).forEach(([k, v]) => (adSlot.dataset[k] = v));

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

const createAdSlot = (
	name: SlotName,
	options: CreateSlotOptions = {},
): HTMLElement => {
	const adSlotConfig = adSlotConfigs[name] ?? {};
	const slotName = options.name ?? adSlotConfig.name ?? name;

	const dataAttributes: DataAttributes = {};

	if (adSlotConfig.label === false) {
		dataAttributes.label = 'false';
	}
	if (adSlotConfig.refresh === false) {
		dataAttributes.refresh = 'false';
	}

	return createAdSlotElement(
		slotName,
		dataAttributes,
		createClasses(slotName, options.classes),
	);
};

export { createAdSlot, concatSizeMappings };

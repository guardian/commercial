import { createAdSlot } from 'core/create-ad-slot';
import { spaceFiller } from 'insert/spacefinder/space-filler';
import type {
	SpacefinderRules,
	SpacefinderWriter,
} from 'insert/spacefinder/spacefinder';
import { commercialFeatures } from 'lib/commercial-features';
import { getCurrentTweakpoint } from 'lib/detect/detect-breakpoint';
import fastdom from '../../utils/fastdom-promise';
import { fillDynamicAdSlot } from '../fill-dynamic-advert-slot';

const bodySelector = '.article-body-commercial-selector';

const wideRules: SpacefinderRules = {
	bodySelector,
	slotSelectors: ' > p',
	minAbove: 500,
	minBelow: 400,
	clearContentMeta: 0,
	selectors: {
		' .element-rich-link': {
			minAboveSlot: 100,
			minBelowSlot: 400,
		},
		' .element-image': {
			minAboveSlot: 440,
			minBelowSlot: 440,
		},

		' .player': {
			minAboveSlot: 50,
			minBelowSlot: 50,
		},
		' > h1': {
			minAboveSlot: 50,
			minBelowSlot: 50,
		},
		' > h2': {
			minAboveSlot: 50,
			minBelowSlot: 50,
		},
		' > *:not(p):not(h2):not(blockquote):not(#sign-in-gate)': {
			minAboveSlot: 50,
			minBelowSlot: 50,
		},
		' .ad-slot': {
			minAboveSlot: 100,
			minBelowSlot: 100,
		},
		' .element-pullquote': {
			minAboveSlot: 400,
			minBelowSlot: 400,
		},
		// Don't place carrot ads near newsletter sign-up blocks
		' > figure[data-spacefinder-role="inline"]': {
			minAboveSlot: 400,
			minBelowSlot: 400,
		},
	},
	fromBottom: true,
};

// anything below leftCol (1140) : desktop, tablet, ..., mobile
const desktopRules: SpacefinderRules = {
	...wideRules,
	selectors: {
		...wideRules.selectors,
		' .element-rich-link': {
			minAboveSlot: 400,
			minBelowSlot: 400,
		},
		' .ad-slot': {
			minAboveSlot: 400,
			minBelowSlot: 400,
		},
		' .ad-slot--im': {
			minAboveSlot: 400,
			minBelowSlot: 400,
		},
	},
};

const insertSlot: SpacefinderWriter = (paras) => {
	const slot = createAdSlot('carrot');
	const candidates = paras.slice(1);
	return fastdom
		.mutate(() => {
			if (candidates[0]?.parentNode) {
				candidates[0].parentNode.insertBefore(slot, candidates[0]);
			}
		})
		.then(() => void fillDynamicAdSlot(slot, true));
};

const getRules = (): SpacefinderRules => {
	switch (getCurrentTweakpoint()) {
		case 'leftCol':
		case 'wide':
			return wideRules;
		default:
			return desktopRules;
	}
};

export const initCarrot = (): Promise<boolean> => {
	if (commercialFeatures.carrotTrafficDriver) {
		return spaceFiller.fillSpace(getRules(), insertSlot, {
			waitForImages: true,
			waitForInteractives: true,
			pass: 'carrot',
		});
	}
	return Promise.resolve(false);
};

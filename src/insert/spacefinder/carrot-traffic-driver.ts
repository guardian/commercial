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
	candidateSelector: ':scope > p',
	minDistanceFromTop: 500,
	minDistanceFromBottom: 400,
	clearContentMeta: 0,
	opponentSelectorRules: {
		'.element-rich-link': {
			marginBottom: 100,
			marginTop: 400,
		},
		'.element-image': {
			marginBottom: 440,
			marginTop: 440,
		},

		'.player': {
			marginBottom: 50,
			marginTop: 50,
		},
		':scope > h1': {
			marginBottom: 50,
			marginTop: 50,
		},
		':scope > h2': {
			marginBottom: 50,
			marginTop: 50,
		},
		':scope > *:not(p):not(h2):not(blockquote):not(#sign-in-gate)': {
			marginBottom: 50,
			marginTop: 50,
		},
		'.ad-slot': {
			marginBottom: 100,
			marginTop: 100,
		},
		'.element-pullquote': {
			marginBottom: 400,
			marginTop: 400,
		},
		// Don't place carrot ads near newsletter sign-up blocks
		':scope > figure[data-spacefinder-role="inline"]': {
			marginBottom: 400,
			marginTop: 400,
		},
	},
	fromBottom: true,
};

// anything below leftCol (1140) : desktop, tablet, ..., mobile
const desktopRules: SpacefinderRules = {
	...wideRules,
	opponentSelectorRules: {
		...wideRules.opponentSelectorRules,
		'.element-rich-link': {
			marginBottom: 400,
			marginTop: 400,
		},
		'.ad-slot': {
			marginBottom: 400,
			marginTop: 400,
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

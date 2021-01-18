import { getBreakpoint } from '@guardian/frontend/static/src/javascripts/lib/detect';
import fastdom from '@guardian/frontend/static/src/javascripts/lib/fastdom-promise';
import mediator from '@guardian/frontend/static/src/javascripts/lib/mediator';
import { spaceFiller } from '@guardian/frontend/static/src/javascripts/projects/common/modules/article/space-filler';
import { commercialFeatures } from '@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/commercial-features';
import { addSlot } from './dfp/add-slot';
import { createSlots } from './dfp/create-slots';

const OFFSET = 1.5; // ratio of the screen height from which ads are loaded
const MAX_ADS = 8; // maximum number of ads to display

let SLOTCOUNTER = 0;
let WINDOWHEIGHT;
let firstSlot;

const startListening = () => {
	mediator.on('modules:autoupdate:updates', onUpdate);
};

const stopListening = () => {
	mediator.off('modules:autoupdate:updates', onUpdate);
};

const getWindowHeight = (doc = document) => {
	if (doc.documentElement && doc.documentElement.clientHeight) {
		return doc.documentElement.clientHeight;
	}
	return 0; // #? zero, or throw an error?
};

const getSpaceFillerRules = (windowHeight, update) => {
	let prevSlot;
	const shouldUpdate = !!update;

	// Only use a slot if it is double the window height from the previous slot.
	const filterSlot = (slot) => {
		if (!prevSlot) {
			prevSlot = slot;
			return !shouldUpdate;
		} else if (Math.abs(slot.top - prevSlot.top) > windowHeight * 2) {
			prevSlot = slot;
			return true;
		}
		return false;
	};

	return {
		bodySelector: '.js-liveblog-body',
		slotSelector: ' > .block',
		fromBottom: shouldUpdate,
		startAt: shouldUpdate ? firstSlot : null,
		absoluteMinAbove: shouldUpdate ? 0 : WINDOWHEIGHT * OFFSET,
		minAbove: 0,
		minBelow: 0,
		clearContentMeta: 0,
		selectors: {},
		filter: filterSlot,
	};
};

const getSlotName = (isMobile, slotCounter) => {
	if (isMobile && slotCounter === 0) {
		return 'top-above-nav';
	} else if (isMobile) {
		return `inline${slotCounter}`;
	}
	return `inline${slotCounter + 1}`;
};

const insertAds = (slots) => {
	const isMobile = getBreakpoint() === 'mobile';

	for (let i = 0; i < slots.length && SLOTCOUNTER < MAX_ADS; i += 1) {
		const slotName = getSlotName(isMobile, SLOTCOUNTER);

		const adSlots = createSlots('inline', {
			name: slotName,
			classes: 'liveblog-inline',
		});

		adSlots.forEach((adSlot) => {
			if (slots[i] && slots[i].parentNode) {
				slots[i].parentNode.insertBefore(adSlot, slots[i].nextSibling);
			}
		});

		// Only add the first adSlot (the DFP one) in DFP/GTP
		if (slots[i] && slots[i].parentNode) {
			addSlot(adSlots[0], false);
			SLOTCOUNTER += 1;
		}
	}
};

const fill = (rules) =>
	spaceFiller.fillSpace(rules, insertAds).then((result) => {
		if (result && SLOTCOUNTER < MAX_ADS) {
			const el = document.querySelector(
				`${rules.bodySelector} > .ad-slot`,
			);
			if (el && el.previousSibling instanceof HTMLElement) {
				firstSlot = el.previousSibling;
			} else {
				firstSlot = null;
			}
			startListening();
		} else {
			firstSlot = null;
		}
	});

const onUpdate = () => {
	stopListening();
	Promise.resolve(getSpaceFillerRules(WINDOWHEIGHT, true)).then(fill);
};

export const init = () => {
	if (!commercialFeatures.liveblogAdverts) {
		return Promise.resolve();
	}

	fastdom
		.measure(() => {
			WINDOWHEIGHT = getWindowHeight();
			return WINDOWHEIGHT;
		})
		.then(getSpaceFillerRules)
		.then(fill);

	return Promise.resolve();
};

export const _ = { getSlotName };

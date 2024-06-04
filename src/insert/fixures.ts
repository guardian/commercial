import { AD_LABEL_HEIGHT } from 'core/constants';
import { createAdSlot, wrapSlotInContainer } from 'core/create-ad-slot';
import { commercialFeatures } from 'lib/commercial-features';
import { getBreakpoint } from 'lib/detect/detect-breakpoint';
import { getViewport } from 'lib/detect/detect-viewport';
import fastdom from '../utils/fastdom-promise';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const LARGEST_AD_SIZE = 600; // px, double mpu
const SPACING = 10; // px, above ad

const insertFootballRightAd = (anchor: HTMLElement) => {
	const slot = createAdSlot('football-right');

	const container = wrapSlotInContainer(slot, {
		className: 'ad-slot-container football-right-ad-container',
	});

	/**
	 * TODO: Move these to a class in frontend
	 */
	container.style.position = 'sticky';
	container.style.top = '0';
	container.style.marginTop = '10px';

	void fastdom
		.mutate(() => {
			anchor.style.height = '100%';
			anchor.appendChild(container);
		})
		.then(() => fillDynamicAdSlot(slot, false));
};

/**
 * Inserts an advert on certain football fixtures/results/tables
 * pages in the right column.
 */
export const init = (): Promise<void> => {
	if (window.guardian.config.isDotcomRendering) {
		return Promise.resolve();
	}

	const currentBreakpoint = getBreakpoint(getViewport().width);
	if (currentBreakpoint !== 'desktop' && currentBreakpoint !== 'wide') {
		return Promise.resolve();
	}

	if (!commercialFeatures.footballFixturesAdverts) {
		return Promise.resolve();
	}

	/**
	 * On Football pages, this right-hand column exists in the DOM but does not
	 * appear to be used. Can we use it for an advert?
	 */
	const anchor: HTMLElement | null = document.querySelector(
		'.content__secondary-column',
	);

	const minSpaceForAd = LARGEST_AD_SIZE + AD_LABEL_HEIGHT + SPACING;

	if (
		anchor === null ||
		anchor.parentElement === null ||
		anchor.parentElement.offsetHeight < minSpaceForAd
	) {
		return Promise.resolve();
	}

	insertFootballRightAd(anchor);

	return Promise.resolve();
};

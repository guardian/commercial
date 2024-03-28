import { createAdSlot, wrapSlotInContainer } from 'core/create-ad-slot';
import fastdom from '../utils/fastdom-promise';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const insertCrosswordsAd = (anchor: HTMLElement) => {
	const slot = createAdSlot('crossword-banner-mobile');

	const container = wrapSlotInContainer(slot, {
		className:
			'fc-container fc-container--commercial dfp-ad--mobile-sticky ad-slot-container--centre-slot crossword-mobile-banner-ad',
	});

	void fastdom
		.mutate(() => {
			if (anchor.parentNode) {
				anchor.parentNode.insertBefore(container, anchor);
			}
		})
		.then(() => fillDynamicAdSlot(slot, false));
};

export const init = (): Promise<void> => {
	if (window.guardian.config.isDotcomRendering) {
		return Promise.resolve();
	}

	const isInMegaTestControl =
		window.guardian.config.tests?.commercialMegaTestControl === 'control';
	if (isInMegaTestControl) {
		return Promise.resolve();
	}

	const isInCrosswordsABTestVariant =
		window.guardian.config.tests?.crosswordMobileBannerVariant ===
		'variant';

	const anchorSelector = isInCrosswordsABTestVariant
		? '.crossword__container__above-controls + *'
		: '.crossword__container__below-controls + *';

	const anchor: HTMLElement | null = document.querySelector(anchorSelector);

	if (anchor) {
		insertCrosswordsAd(anchor);
	} else {
		window.addEventListener(
			'crossword-loaded',
			() => {
				const anchor: HTMLElement | null =
					document.querySelector(anchorSelector);
				if (anchor) {
					insertCrosswordsAd(anchor);
				}
			},
			{ once: true },
		);
	}

	return Promise.resolve();
};

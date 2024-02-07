import { createAdSlot, wrapSlotInContainer } from 'core/create-ad-slot';
import fastdom from '../utils/fastdom-promise';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const insertCrosswordsAd = (anchor: HTMLElement) => {
	console.log('Inserting mobile crossword banner INSODE FUNCTION');
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
	const isInABTest =
		window.guardian.config.tests?.crosswordMobileBannerVariant ===
		'variant'; //if we are not in the ad test group the LEAVE

	if (window.guardian.config.isDotcomRendering || !isInABTest) {
		console.log('Inserting mobile crossword banner');
		return Promise.resolve();
	}

	const anchorSelector = window.guardian.config.page.commentable
		? '.crossword__container__below-controls + *'
		: '.content-footer > :first-child';

	const anchor: HTMLElement | null = document.querySelector(anchorSelector);
	console.log('ANCGOR', anchor);

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

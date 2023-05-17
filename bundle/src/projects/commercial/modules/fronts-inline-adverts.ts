import { createAdSlot, slotSizeMappings } from '@guardian/commercial-core';
import { log } from '@guardian/libs';
import { getCurrentBreakpoint } from '../../../lib/detect-breakpoint';
import fastdom from '../../../lib/fastdom-promise';
import { commercialFeatures } from '../../common/modules/commercial/commercial-features';
import { addSlot } from './dfp/add-slot';
import type { Advert } from './dfp/Advert';

const insertedDynamicAds: Advert[] = [];

const sectionsToInsertAdvertsAbove = [
	'spotlight',
	'sport',
	'around-the-world',
	'lifestyle',
	'in-pictures',
];

// // Remember to stop serving merch ads on this page, wherever that happens. Might be the same with MPU's.
// // We don't want to request an ad, serve an impression, then immediately remove it.
// const hideMerchSlots = (): Promise<void> => {
// 	return fastdom.measure(() => document.querySelectorAll("fc-container--commercial")).then((allMerchSlots) => {
// 		return fastdom.mutate(() => {
// 			allMerchSlots.forEach(slot => slot.remove())
// 		})
// 	})
// }

// const hideMpus = (): Promise<void> => {
// 	const mpuParentSelector = "li.fc-slice__item--mpu-candidate"
// 	const allMpus = document.querySelectorAll(`${mpuParentSelector} > div.ad-slot-container`);

// 	return fastdom.mutate(() => {
// 		allMpus.forEach(mpu => mpu.parentElement?.remove())
// 	})
// }

/**
 * Initialise front banner ads
 */
export const init = (): Promise<void> => {
	const { switches } = window.guardian.config;
	// TODO check for test
	if (!switches.frontsBannerAds) {
		console.log('DOM: feature not enabled');
		// return Promise.resolve();
	}

	const {
		isDotcomRendering,
		page: { contentType, edition },
	} = window.guardian.config;

	console.log({ isDotcomRendering });
	console.log({ contentType });
	console.log({ edition });

	// const isUkNetworkFront = contentType === "Network Front" && edition === "UK"
	const isUkNetworkFront = edition === 'UK';
	if (!isUkNetworkFront) {
		console.log('DOM: not /uk');
		return Promise.resolve();
	}

	// Exclude DCR pages at this stage
	if (isDotcomRendering) {
		console.log('DOM: is DCR');
		// return Promise.resolve();
	}

	// We don't want to run front banner ads on viewports smaller than desktop
	const breakpoint = getCurrentBreakpoint();
	const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';
	if (isMobileOrTablet) {
		console.log('DOM: Not desktop');
		return Promise.resolve();
	}

	// void hideMpus();
	// void hideMerchSlots();

	return fastdom.measure(() => {
		sectionsToInsertAdvertsAbove.forEach((section, index) => {
			const sectionNode = document.querySelector(`section#${section}`);
			if (!sectionNode) return;

			const ad = createAdSlot('fronts-banner', {
				name: `fronts-banner-${index + 1}`,
				classes: 'fronts-banner',
			});

			const adContainer = document.createElement('div');
			adContainer.className = 'ad-slot-container fronts-banner-container';
			adContainer.appendChild(ad);

			console.log('Inserting dom slot above', section);

			void fastdom
				.mutate(() => {
					sectionNode.parentElement?.insertBefore(
						adContainer,
						sectionNode,
					);
				})
				.then(async () => {
					const advert = await addSlot(
						ad,
						false,
						slotSizeMappings['fronts-banner'],
					);
					if (advert) {
						insertedDynamicAds.push(advert);
					}
				});
		});
	});
};

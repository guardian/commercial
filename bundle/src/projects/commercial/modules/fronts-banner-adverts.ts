import { createAdSlot } from '@guardian/commercial-core';
import fastdom from '../../../lib/fastdom-promise';
import { addSlot } from './dfp/add-slot';

/**
 * A fronts banner advert will be inserted above each of the following sections.
 */
const sections = [
	'opinion',
	'sport',
	'around-the-world',
	'lifestyle',
	'in-pictures',
];

const insertAdvertAboveSection = async (section: string, advertNum: number) => {
	await fastdom.measure(() => {
		const sectionNode = document.querySelector(`section#${section}`);
		if (!sectionNode) return;

		const ad = createAdSlot('fronts-banner', {
			name: `fronts-banner-${advertNum}`,
			classes: 'fronts-banner',
		});

		const adContainer = document.createElement('div');
		adContainer.className = 'ad-slot-container fronts-banner-container';
		adContainer.appendChild(ad);

		void fastdom
			.mutate(() => {
				sectionNode.parentElement?.insertBefore(
					adContainer,
					sectionNode,
				);
			})
			.then(() => {
				void addSlot(ad, false);
			});
	});
};

export const init = async (): Promise<void> => {
	const { switches, tests } = window.guardian.config;

	const {
		isDotcomRendering,
		page: { contentType, edition },
	} = window.guardian.config;

	const isUkNetworkFront =
		contentType === 'Network Front' && edition === 'UK';

	if (
		!switches.frontsBannerAds ||
		tests?.frontsBannerAdsVariant !== 'variant' ||
		!isUkNetworkFront ||
		isDotcomRendering
	) {
		return;
	}

	const promises = sections.map(async (section, index) => {
		await insertAdvertAboveSection(section, index + 1);
	});

	await Promise.allSettled(promises);
};

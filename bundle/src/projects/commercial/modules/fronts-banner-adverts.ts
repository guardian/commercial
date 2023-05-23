import { createAdSlot, slotSizeMappings } from '@guardian/commercial-core';
import fastdom from '../../../lib/fastdom-promise';
import { addSlot } from './dfp/add-slot';

const sections = [
	'opinion',
	'spotlight', // FOR TESTING PURPOSES
	'coronavirus', // FOR TESTING PURPOSES
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
			.then(async () => {
				await addSlot(ad, false, slotSizeMappings['fronts-banner']);
			});
	});
};

export const init = async (): Promise<void> => {
	const { switches, tests } = window.guardian.config;
	if (
		!switches.frontsBannerAds ||
		tests?.frontsBannerAdsVariant !== 'variant'
	) {
		return Promise.resolve();
	}

	const {
		isDotcomRendering,
		page: { contentType, edition },
	} = window.guardian.config;

	const isUkNetworkFront =
		contentType === 'Network Front' && edition === 'UK';
	if (!isUkNetworkFront || isDotcomRendering) {
		return Promise.resolve();
	}

	sections.map(async (section, index) => {
		await insertAdvertAboveSection(section, index + 1);
	});

	return Promise.resolve();
};

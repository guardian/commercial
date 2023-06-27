import { createAdSlot } from 'core/create-ad-slot';
import { addSlot } from './dfp/add-slot';
import fastdom from './fastdom-promise';

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

		// To distinguish between the variant and control in the page view table. Following the AB test advice given here:
		// https://github.com/guardian/frontend/blob/main/docs/03-dev-howtos/01-ab-testing.md#getting-the-results
		if (section === 'opinion') {
			adContainer.dataset.component = 'opinion-banner-ad';
		}

		adContainer.appendChild(ad);

		const slotTargeting = {
			'front-section': sectionNode.id,
		};

		void fastdom
			.mutate(() => {
				sectionNode.parentElement?.insertBefore(
					adContainer,
					sectionNode,
				);
			})
			.then(() => {
				void addSlot(ad, false, {}, slotTargeting);
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
		return insertAdvertAboveSection(section, index + 1);
	});

	await Promise.allSettled(promises);
};

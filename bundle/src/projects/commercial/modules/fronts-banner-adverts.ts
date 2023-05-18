import { createAdSlot, slotSizeMappings } from '@guardian/commercial-core';
import { getCurrentBreakpoint } from '../../../lib/detect-breakpoint';
import fastdom from '../../../lib/fastdom-promise';
import { addSlot } from './dfp/add-slot';

const sectionsToInsertAdvertsAbove = [
	'opinion',
	'spotlight',
	'coronavirus',
	'sport',
	'around-the-world',
	'lifestyle',
	'in-pictures',
];

let numBannerAdsInserted = 0;

const insertAdvertAboveSection = (section: string) => {
	return fastdom.measure(() => {
		const sectionNode = document.querySelector(`section#${section}`);
		if (!sectionNode) return;

		numBannerAdsInserted++;
		const ad = createAdSlot('fronts-banner', {
			name: `fronts-banner-${numBannerAdsInserted}`,
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

export const init = (): Promise<void> => {
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

	// Exclude viewports smaller than desktop
	const breakpoint = getCurrentBreakpoint();
	const isMobileOrTablet = breakpoint === 'mobile' || breakpoint === 'tablet';
	if (isMobileOrTablet) {
		return Promise.resolve();
	}

	sectionsToInsertAdvertsAbove.forEach((section) => {
		void insertAdvertAboveSection(section);
	});

	return Promise.resolve();
};

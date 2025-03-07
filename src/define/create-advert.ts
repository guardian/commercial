import { log } from '@guardian/libs';
import type { SizeMapping } from '../lib/ad-sizes';
import { reportError } from '../lib/error/report-error';
import { Advert } from './Advert';

const createAdvert = (
	adSlot: HTMLElement,
	additionalSizes?: SizeMapping,
	slotTargeting?: Record<string, string>,
): Advert | null => {
	try {
		const advert = new Advert(adSlot, additionalSizes, slotTargeting);
		return advert;
	} catch (error) {
		const errMsg = `Could not create advert. Ad slot: ${
			adSlot.id
		}. Additional Sizes: ${JSON.stringify(additionalSizes)}. Error: ${
			error instanceof Error ? error.message : 'Unknown error'
		}`;

		log('commercial', errMsg);

		// The DuckDuckGo browser blocks ads from loading by default, so it causes a lot of noise in Sentry.
		// We filter these errors out here - DuckDuckGo is in the user agent string if someone is using the
		// desktop browser, and Ddg is present for those using the mobile browser, so we filter out both.
		if (
			!navigator.userAgent.includes('DuckDuckGo') &&
			!navigator.userAgent.includes('Ddg')
		) {
			reportError(new Error(errMsg), 'commercial');
		}

		return null;
	}
};

export { createAdvert };

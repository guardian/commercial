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

		if (!navigator.userAgent.includes('DuckDuckGo')) {
			reportError(new Error(errMsg), 'commercial');
		}

		return null;
	}
};

export { createAdvert };

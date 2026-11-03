import type { SizeMapping } from '@guardian/commercial-core/ad-sizes';
import { log } from '@guardian/libs';
import { reportError } from '../lib/error/report-error';
import { Advert } from './Advert';
import { DefineSlotError } from './define-slot';
import { renderInline1Preview } from './inline1-preview';

const createAdvert = (
	adSlot: HTMLElement,
	additionalSizes?: SizeMapping,
	slotTargeting?: Record<string, string>,
): Advert | null => {
	// Do not define a GPT slot: SRA would request it even without display().
	if (renderInline1Preview(adSlot)) {
		return null;
	}

	try {
		const advert = new Advert(adSlot, additionalSizes, slotTargeting);
		return advert;
	} catch (error) {
		if (error instanceof DefineSlotError) {
			log('commercial', error.message, {
				adSlotId: adSlot.id,
				sizeMapping: error.sizeMapping,
			});
			if (error.report) {
				reportError(
					error,
					'commercial',
					{},
					{
						adSlotId: adSlot.id,
						sizeMapping: error.sizeMapping,
					},
				);
			}
		} else {
			log(
				'commercial',
				error instanceof Error ? error.message : String(error),
			);

			// The DuckDuckGo browser blocks ads from loading by default, so it causes a lot of noise in Sentry.
			// We filter these errors out here - DuckDuckGo is in the user agent string if someone is using the
			// desktop browser, and Ddg is present for those using the mobile browser, so we filter out both.
			if (
				!navigator.userAgent.includes('DuckDuckGo') &&
				!navigator.userAgent.includes('Ddg')
			) {
				reportError(
					error,
					'commercial',
					{},
					{
						adSlotId: adSlot.id,
						additionalSizes: additionalSizes,
					},
				);
			}
		}

		return null;
	}
};

export { createAdvert };

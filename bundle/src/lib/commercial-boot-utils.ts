import { EventTimer } from '@guardian/commercial-core/event-timer';
import { log } from '@guardian/libs';
import type { Advert, AdvertStatus } from '../define/Advert';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { adSlotIdPrefix } from './dfp/dfp-env-globals';
import { addListenerToStore } from './dfp/register-advert';
import { reportError } from './error/report-error';
import { createCommercialQueue } from './guardian-commercial-queue';


const tags: Record<string, string> = {
	bundle: 'standalone',
};

const recordCommercialMetrics = (): void => {
	const eventTimer = EventTimer.get();
	eventTimer.mark('commercialBootEnd');
	eventTimer.mark('commercialModulesLoaded');
	// record the number of ad slots on the page
	const adSlotsTotal = document.querySelectorAll(
		`[id^="${adSlotIdPrefix}"]`,
	).length;
	eventTimer.setProperty('adSlotsTotal', adSlotsTotal);

	// and the number of inline ad slots
	const adSlotsInline = document.querySelectorAll(
		`[id^="${adSlotIdPrefix}inline"]`,
	).length;
	eventTimer.setProperty('adSlotsInline', adSlotsInline);
};

const setupWindowCommercial = (): void => {
	// Initialise the commercial queue
	window.guardian.commercial ??= {};
	window.guardian.commercial.queue = createCommercialQueue(
		Array.isArray(window.guardian.commercial.queue)
			? window.guardian.commercial.queue
			: [],
	);
	window.guardian.commercial.queue.flush();

	window.guardian.commercial.onAdEvent = (status: AdvertStatus | AdvertStatus[], callback: (advert: Advert) => void) => {
		addListenerToStore(status, callback);
		window.guardian.commercial?.queue?.push(() => {
			dfpEnv.adverts.forEach((advert) => advert.on(status, () => callback(advert)));
		});
	};

};

const bootCommercial = async (
	modules: Array<() => Promise<unknown>>,
): Promise<void> => {
	log('commercial', '📦 standalone.commercial.ts', __webpack_public_path__);
	if (process.env.COMMIT_SHA) {
		log(
			'commercial',
			`@guardian/commercial-core commit https://github.com/guardian/commercial/blob/${process.env.COMMIT_SHA}`,
		);
	}

	// Init Commercial event timers
	EventTimer.init();
	EventTimer.get().mark('commercialStart');
	EventTimer.get().mark('commercialBootStart');

	// Stub the googletag command queue
	// @ts-expect-error -- it’s a stub, not the whole Googletag object
	window.googletag = {
		cmd: [],
	};

	try {
		return Promise.allSettled(modules.map((module) => module())).then(
			() => {
				recordCommercialMetrics();
				setupWindowCommercial();
			},
		);
	} catch (error) {
		// report async errors in bootCommercial to Sentry with the commercial feature tag
		reportError(error, 'commercial', tags);
	}
};

export { bootCommercial };

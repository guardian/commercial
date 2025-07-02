import { EventTimer } from '@guardian/commercial/event-timer';
import { log } from '@guardian/libs';
import { adSlotIdPrefix } from './dfp/dfp-env-globals';
import { reportError } from './error/report-error';

const tags: Record<string, string> = {
	bundle: 'standalone',
};

const recordCommercialMetrics = () => {
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

const bootCommercial = async (
	modules: Array<() => Promise<unknown>>,
): Promise<void> => {
	log('commercial', '📦 standalone.commercial.ts', __webpack_public_path__);
	if (process.env.COMMIT_SHA) {
		log(
			'commercial',
			`@guardian/commercial commit https://github.com/guardian/commercial/blob/${process.env.COMMIT_SHA}`,
		);
	}

	// Init Commercial event timers
	EventTimer.init();
	EventTimer.get().mark('commercialStart');
	EventTimer.get().mark('commercialBootStart');

	// Stub the command queue
	// @ts-expect-error -- it’s a stub, not the whole Googletag object
	window.googletag = {
		cmd: [],
	};

	try {
		return Promise.allSettled(modules.map((module) => module())).then(
			recordCommercialMetrics,
		);
	} catch (error) {
		// report async errors in bootCommercial to Sentry with the commercial feature tag
		reportError(error, 'commercial', tags);
	}
};

export { bootCommercial };

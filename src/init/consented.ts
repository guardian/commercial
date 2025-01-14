import { log } from '@guardian/libs';
import { init as prepareAdVerification } from '../lib/ad-verification/prepare-ad-verification';
import { commercialFeatures } from '../lib/commercial-features';
import { adSlotIdPrefix } from '../lib/dfp/dfp-env-globals';
import { reportError } from '../lib/error/report-error';
import { catchErrorsAndReport } from '../lib/error/robust';
import { EventTimer } from '../lib/event-timer';
import { adFreeSlotRemove } from './consented/ad-free-slot-remove';
import { init as initComscore } from './consented/comscore';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { initFillSlotListener } from './consented/fill-slot-listener';
import { init as initIpsosMori } from './consented/ipsos-mori';
import { init as initMessenger } from './consented/messenger';
import { init as prepareA9 } from './consented/prepare-a9';
import { init as prepareGoogletag } from './consented/prepare-googletag';
import { initPermutive } from './consented/prepare-permutive';
import { init as preparePrebid } from './consented/prepare-prebid';
import { removeDisabledSlots as closeDisabledSlots } from './consented/remove-slots';
import { initTeadsCookieless } from './consented/teads-cookieless';
import { init as initThirdPartyTags } from './consented/third-party-tags';
import { init as initTrackGpcSignal } from './consented/track-gpc-signal';
import { init as initTrackScrollDepth } from './consented/track-scroll-depth';
import { reloadPageOnConsentChange } from './shared/reload-page-on-consent-change';
import { init as setAdTestCookie } from './shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from './shared/set-adtest-in-labels-cookie';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const tags: Record<string, string> = {
	bundle: 'standalone',
};
// modules necessary to load the first ads on the page
const commercialBaseModules: Modules = [];

// remaining modules not necessary to load an ad
const commercialExtraModules: Modules = [
	['cm-adFreeSlotRemoveFronts', adFreeSlotRemove],
	['cm-closeDisabledSlots', closeDisabledSlots],
	['cm-comscore', initComscore],
	['cm-ipsosmori', initIpsosMori],
	['cm-teadsCookieless', initTeadsCookieless],
	['cm-trackScrollDepth', initTrackScrollDepth],
	['cm-trackGpcSignal', initTrackGpcSignal],
];

if (!commercialFeatures.adFree) {
	commercialBaseModules.push(
		['cm-messenger', initMessenger],
		['cm-setAdTestCookie', setAdTestCookie],
		['cm-setAdTestInLabelsCookie', setAdTestInLabelsCookie],
		['cm-reloadPageOnConsentChange', reloadPageOnConsentChange],
		['cm-prepare-prebid', preparePrebid],
		// Permutive init code must run before google tag enableServices()
		// The permutive lib however is loaded async with the third party tags
		['cm-dfp-listeners', initDfpListeners],
		['cm-prepare-googletag', () => initPermutive().then(prepareGoogletag)],
		['cm-dynamic-a-slots', initDynamicAdSlots],
		['cm-prepare-a9', prepareA9],
		['cm-prepare-fill-slot-listener', initFillSlotListener],
	);
	commercialExtraModules.push(
		['cm-prepare-adverification', prepareAdVerification],
		['cm-thirdPartyTags', initThirdPartyTags],
	);
}

const loadModules = (modules: Modules, eventName: string) => {
	const modulePromises: Array<Promise<unknown>> = [];

	modules.forEach((module) => {
		const [moduleName, moduleInit] = module;

		catchErrorsAndReport(
			[
				[
					moduleName,
					function pushAfterComplete(): void {
						const result = moduleInit();
						modulePromises.push(result);
					},
				],
			],
			tags,
		);
	});

	return Promise.allSettled(modulePromises).then(() => {
		EventTimer.get().mark(eventName);
	});
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

const bootCommercial = async (): Promise<void> => {
	log('commercial', '📦 standalone.commercial.ts', __webpack_public_path__);
	if (process.env.COMMIT_SHA) {
		log(
			'commercial',
			`@guardian/commercial commit https://github.com/guardian/commercial/blob/${process.env.COMMIT_SHA}`,
		);
	}

	// Init Commercial event timers
	EventTimer.init();

	catchErrorsAndReport(
		[
			[
				'ga-user-timing-commercial-start',
				function runTrackPerformance() {
					EventTimer.get().mark('commercialStart');
					EventTimer.get().mark('commercialBootStart');
				},
			],
		],
		tags,
	);

	// Stub the command queue
	// @ts-expect-error -- it’s a stub, not the whole Googletag object
	window.googletag = {
		cmd: [],
	};

	try {
		const allModules: Array<Parameters<typeof loadModules>> = [
			[commercialBaseModules, 'commercialBaseModulesLoaded'],
			[commercialExtraModules, 'commercialExtraModulesLoaded'],
		];
		const promises = allModules.map((args) => loadModules(...args));

		await Promise.all(promises).then(recordCommercialMetrics);
	} catch (error) {
		// report async errors in bootCommercial to Sentry with the commercial feature tag
		reportError(error, 'commercial', tags);
	}
};

const bootCommercialWhenReady = () => {
	if (!!window.guardian.mustardCut || !!window.guardian.polyfilled) {
		void bootCommercial();
	} else {
		window.guardian.queue.push(bootCommercial);
	}
};

export { bootCommercialWhenReady };

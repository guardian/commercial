import { log } from '@guardian/libs';
import { EventTimer } from 'core/event-timer';
import { adFreeSlotRemove } from 'init/consented/ad-free-slot-remove';
import { init as initComscore } from 'init/consented/comscore';
import { initFillSlotListener } from 'init/consented/fill-slot-listener';
import { init as initIpsosMori } from 'init/consented/ipsos-mori';
import { init as prepareA9 } from 'init/consented/prepare-a9';
import { init as prepareGoogletag } from 'init/consented/prepare-googletag';
import { initPermutive } from 'init/consented/prepare-permutive';
import { init as preparePrebid } from 'init/consented/prepare-prebid';
import { removeDisabledSlots as closeDisabledSlots } from 'init/consented/remove-slots';
import { initTeadsCookieless } from 'init/consented/teads-cookieless';
import { init as initThirdPartyTags } from 'init/consented/third-party-tags';
import { init as initTrackGpcSignal } from 'init/consented/track-gpc-signal';
import { init as initTrackScrollDepth } from 'init/consented/track-scroll-depth';
import { reloadPageOnConsentChange } from 'init/shared/reload-page-on-consent-change';
import { init as setAdTestCookie } from 'init/shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from 'init/shared/set-adtest-in-labels-cookie';
import { init as prepareAdVerification } from 'lib/ad-verification/prepare-ad-verification';
import { commercialFeatures } from 'lib/commercial-features';
import { adSlotIdPrefix } from 'lib/dfp/dfp-env-globals';
import { reportError } from 'utils/report-error';
import { catchErrorsWithContext } from 'utils/robust';
import { initDfpListeners } from './consented/dfp-listeners';
import { initDynamicAdSlots } from './consented/dynamic-ad-slots';
import { init as initMessenger } from './consented/messenger';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const tags: Record<string, string> = {
	feature: 'commercial',
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

		catchErrorsWithContext(
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

	catchErrorsWithContext(
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
		reportError(error, tags, false);
	}
};

const bootCommercialWhenReady = () => {
	if (window.guardian.mustardCut || window.guardian.polyfilled) {
		void bootCommercial();
	} else {
		window.guardian.queue.push(bootCommercial);
	}
};

export { bootCommercialWhenReady };

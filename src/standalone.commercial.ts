/*
 * This standalone bundle is so called because it “stands alone”,
 * meaning it is not part of another webpack build process, and
 * can be imported as a JS <script>.
 *
 * See PR https://github.com/guardian/frontend/pull/24058
 *
 * The standalone commercial bundle is bundled from source files
 * here in Frontend, but is served from https://assets.guim.co.uk
 * in production DCR and Frontend.
 *
 * Changes here will be served on DCR & Frontend rendered pages.
 */

import {
	getConsentFor,
	onConsent,
} from '@guardian/consent-management-platform';
import { log } from '@guardian/libs';
import { init as prepareAdVerification } from 'ad-verification/prepare-ad-verification';
import { EventTimer } from 'core/event-timer';
import { adSlotIdPrefix } from 'dfp/dfp-env-globals';
import { adFreeSlotRemove } from 'init/consented/ad-free-slot-remove';
import { init as initArticleAsideAdverts } from 'init/consented/article-aside-adverts';
import { init as initArticleBodyAdverts } from 'init/consented/article-body-adverts';
import { initCommentsExpandedAdverts } from 'init/consented/comments-expanded-advert';
import { init as initComscore } from 'init/consented/comscore';
import { initFillSlotListener } from 'init/consented/fill-slot-listener';
import { init as initHighMerch } from 'init/consented/high-merch';
import { init as initIpsosMori } from 'init/consented/ipsos-mori';
import { init as initLiveblogAdverts } from 'init/consented/liveblog-adverts';
import { init as initMobileSticky } from 'init/consented/mobile-sticky';
import { init as prepareA9 } from 'init/consented/prepare-a9';
import { init as prepareGoogletag } from 'init/consented/prepare-googletag';
import { initPermutive } from 'init/consented/prepare-permutive';
import { init as preparePrebid } from 'init/consented/prepare-prebid';
import { init as initRedplanet } from 'init/consented/redplanet';
import { removeConsentedAdsOnConsentChange } from 'init/consented/remove-consented-ads-on-consent-change';
import { removeDisabledSlots as closeDisabledSlots } from 'init/consented/remove-slots';
import { initTeadsCookieless } from 'init/consented/teads-cookieless';
import { init as initThirdPartyTags } from 'init/consented/third-party-tags';
import { init as initTrackGpcSignal } from 'init/consented/track-gpc-signal';
import { init as initTrackScrollDepth } from 'init/consented/track-scroll-depth';
import { init as setAdTestCookie } from 'init/shared/set-adtest-cookie';
import { init as setAdTestInLabelsCookie } from 'init/shared/set-adtest-in-labels-cookie';
import { commercialFeatures } from 'lib/commercial-features';
import { reportError } from 'utils/report-error';
import { catchErrorsWithContext } from 'utils/robust';

type Modules = Array<[`${string}-${string}`, () => Promise<unknown>]>;

const { frontendAssetsFullURL, switches, page } = window.guardian.config;

const decideAssetsPath = () => {
	if (process.env.OVERRIDE_BUNDLE_PATH) {
		return process.env.OVERRIDE_BUNDLE_PATH;
	}
	const assetsPath = frontendAssetsFullURL ?? page.assetsPath;
	return `${assetsPath}javascripts/commercial/`;
};

__webpack_public_path__ = decideAssetsPath();

const tags: Record<string, string> = {
	feature: 'commercial',
	bundle: 'standalone',
};

// modules necessary to load the first ads on the page
const commercialBaseModules: Modules = [];

// remaining modules not necessary to load an ad
const commercialExtraModules: Modules = [
	['cm-adFreeSlotRemoveFronts', adFreeSlotRemove],
	['cm-removeConsentedAdsOnConsentChange', removeConsentedAdsOnConsentChange],
	['cm-closeDisabledSlots', closeDisabledSlots],
	['cm-comscore', initComscore],
	['cm-ipsosmori', initIpsosMori],
	['cm-teadsCookieless', initTeadsCookieless],
	['cm-trackScrollDepth', initTrackScrollDepth],
	['cm-trackGpcSignal', initTrackGpcSignal],
];

if (!commercialFeatures.adFree) {
	commercialBaseModules.push(
		['cm-setAdTestCookie', setAdTestCookie],
		['cm-setAdTestInLabelsCookie', setAdTestInLabelsCookie],
		['cm-prepare-prebid', preparePrebid],
		// Permutive init code must run before google tag enableServices()
		// The permutive lib however is loaded async with the third party tags
		['cm-prepare-googletag', () => initPermutive().then(prepareGoogletag)],
		['cm-prepare-a9', prepareA9],
		['cm-prepare-fill-slot-listener', initFillSlotListener],
	);
	commercialExtraModules.push(
		['cm-prepare-adverification', prepareAdVerification],
		['cm-mobileSticky', initMobileSticky],
		['cm-highMerch', initHighMerch],
		['cm-articleAsideAdverts', initArticleAsideAdverts],
		['cm-articleBodyAdverts', initArticleBodyAdverts],
		['cm-liveblogAdverts', initLiveblogAdverts],
		['cm-commentsExpandedAdverts', initCommentsExpandedAdverts],
		['cm-thirdPartyTags', initThirdPartyTags],
		['cm-redplanet', initRedplanet],
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

/**
 * Choose whether to launch Googletag or Opt Out tag (ootag) based on consent state
 */
const chooseAdvertisingTag = async () => {
	const consentState = await onConsent();
	// Only load the Opt Out tag if:
	// - in TCF region
	// - no consent for Googletag
	// - the user is not a subscriber
	if (
		consentState.tcfv2 &&
		!getConsentFor('googletag', consentState) &&
		!commercialFeatures.adFree
	) {
		void import(
			/* webpackChunkName: "consentless" */
			'./commercial.consentless'
		).then(({ bootConsentless }) => bootConsentless(consentState));
	} else {
		bootCommercialWhenReady();
	}
};

/**
 * If the consentless switch is on decide whether to boot consentless or normal consented
 * If the consentless switch is off boot normal consented
 */
if (switches.optOutAdvertising) {
	void chooseAdvertisingTag();
} else {
	bootCommercialWhenReady();
}

import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { loadScript, log } from '@guardian/libs';
import { buildPageTargetingConsentless } from 'core/targeting/build-page-targeting-consentless';
import { commercialFeatures } from 'lib/commercial-features';

function initConsentless(consentState: ConsentState): Promise<void> {
	return new Promise((resolve) => {
		// Stub the command queue
		// @ts-expect-error -- it’s a stub, not the whole OO tag object
		window.ootag = {
			queue: [],
		};
		window.ootag.queue.push(
			() =>
				async function () {
					// Ensures Opt Out logs are namespaced under Commercial
					window.ootag.logger = (...args: unknown[]) => {
						log('commercial', '[Opt Out Ads]', ...args);
					};

					window.ootag.initializeOo({
						publisher: 33,
						// We set our own custom logger above
						noLogging: 1,
						alwaysNoConsent: 1,
						noRequestsOnPageLoad: 1,
					});

					Object.entries(
						await buildPageTargetingConsentless(
							consentState,
							commercialFeatures.adFree,
						),
					).forEach(([key, value]) => {
						if (!value) {
							return;
						}
						window.ootag.addParameter(key, value);
					});
					resolve();
				},
		);

		void loadScript(
			'//cdn.optoutadvertising.com/script/ooguardian.v4.min.js',
		);
	});
}

export { initConsentless };

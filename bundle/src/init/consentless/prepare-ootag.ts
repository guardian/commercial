import type { ConsentState } from '@guardian/consent-manager';
import { loadScript, log } from '@guardian/libs';
import { isAdFree } from '../../lib/ad-free';
import { isUserLoggedIn } from '../../lib/identity/api';
import { buildPageTargetingConsentless } from '../../lib/targeting/build-page-targeting-consentless';

function initConsentless(consentState: ConsentState): Promise<void> {
	return new Promise((resolve) => {
		// Stub the command queue
		// @ts-expect-error -- it’s a stub, not the whole OO tag object
		window.ootag = {
			queue: [],
		};

		window.ootag.queue.push(function () {
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

			void isUserLoggedIn().then((isSignedIn) => {
				Object.entries(
					buildPageTargetingConsentless(
						consentState,
						isAdFree(),
						isSignedIn,
					),
				).forEach(([key, value]) => {
					if (!value) {
						return;
					}
					window.ootag.addParameter(key, value);
				});
				resolve();
			});
		});

		void loadScript(
			'//cdn.optoutadvertising.com/script/ooguardian.v4.min.js',
		);
	});
}

export { initConsentless };

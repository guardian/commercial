import type { ConsentState } from '@guardian/libs';
import { loadScript, log } from '@guardian/libs';
import { getVariant } from 'experiments/ab';
import { optOutFrequencyCap } from 'experiments/tests/opt-out-frequency-cap';
import { commercialFeatures } from 'lib/commercial-features';
import { isUserLoggedInOktaRefactor } from 'lib/identity/api';
import { buildPageTargetingConsentless } from '../../core/targeting/build-page-targeting-consentless';

const frequencyCapTimeoutFromVariant = (variant: string): number => {
	if (!variant.startsWith('timeout-')) {
		return 0;
	}
	const timeout = variant.replace('timeout-', '');
	return parseInt(timeout, 10);
};

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

			const frequencyCapVariant = getVariant(optOutFrequencyCap);

			const isInFrequencyCapTest =
				frequencyCapVariant !== undefined &&
				frequencyCapVariant !== 'control';

			const timeoutFrequencyCappingMS = isInFrequencyCapTest
				? frequencyCapTimeoutFromVariant(frequencyCapVariant)
				: undefined;

			window.ootag.initializeOo({
				publisher: 33,
				// We set our own custom logger above
				noLogging: 1,
				alwaysNoConsent: 1,
				noRequestsOnPageLoad: 1,
				frequencyScript: isInFrequencyCapTest
					? 'https://frequencycappingwithoutpersonaldata.com/script/iframe'
					: undefined,
				timeoutFrequencyCappingMS,
			});

			void isUserLoggedInOktaRefactor().then((isSignedIn) => {
				Object.entries(
					buildPageTargetingConsentless(
						consentState,
						commercialFeatures.adFree,
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

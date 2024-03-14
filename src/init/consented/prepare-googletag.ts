import type { ConsentState } from '@guardian/libs';
import { getConsentFor, loadScript, log, onConsent } from '@guardian/libs';
import { EventTimer } from 'core/event-timer';
import { getPageTargeting } from 'lib/build-page-targeting';
import { commercialFeatures } from 'lib/commercial-features';
import { getGoogleTagId, isUserLoggedInOktaRefactor } from 'lib/identity/api';
import { removeSlots } from './remove-slots';
import { fillStaticAdvertSlots } from './static-ad-slots';

const setPageTargeting = (consentState: ConsentState, isSignedIn: boolean) =>
	Object.entries(getPageTargeting(consentState, isSignedIn)).forEach(
		([key, value]) => {
			if (!value) return;
			window.googletag.pubads().setTargeting(key, value);
		},
	);

/**
 * Also known as PPID
 */
const setPublisherProvidedId = (): void => {
	void getGoogleTagId().then((googleTagId) => {
		if (googleTagId !== null) {
			window.googletag.pubads().setPublisherProvidedId(googleTagId);
		}
	});
};

/**
 * 	Track usage of cookieDeprecationLabel
 */
const setCookieDeprecationLabel = (): void => {
	if ('cookieDeprecationLabel' in navigator) {
		void navigator.cookieDeprecationLabel?.getValue().then((value) => {
			const cookieDeprecationLabel = value || 'empty';
			window.googletag
				.pubads()
				.setTargeting('cookieDeprecationLabel', cookieDeprecationLabel);
		});
	}
};

export const init = (): Promise<void> => {
	const setupAdvertising = (): Promise<void> => {
		return onConsent().then(async (consentState: ConsentState) => {
			EventTimer.get().mark('googletagInitStart');
			let canRun = true;

			if (consentState.canTarget) {
				window.googletag.cmd.push(setPublisherProvidedId);
				window.googletag.cmd.push(setCookieDeprecationLabel);
			}

			if (consentState.ccpa) {
				// CCPA mode
				// canRun stays true, set RDP flag
				window.googletag.cmd.push(() => {
					window.googletag.pubads().setPrivacySettings({
						restrictDataProcessing: !consentState.canTarget,
					});
				});
			} else if (consentState.tcfv2) {
				// TCFv2 mode
				canRun = getConsentFor('googletag', consentState);
			} else if (consentState.aus) {
				// AUS mode
				const nonPersonalizedAds = !getConsentFor(
					'googletag',
					consentState,
				);
				window.googletag.cmd.push(() => {
					window.googletag.pubads().setPrivacySettings({
						nonPersonalizedAds,
					});
				});
			}

			// Prebid will already be loaded, and window.googletag is stubbed in `commercial.js`.
			// Just load googletag. Prebid will already be loaded, and googletag is already added to the window by Prebid.
			if (canRun) {
				const isSignedIn = await isUserLoggedInOktaRefactor();
				window.googletag.cmd.push(
					() => EventTimer.get().mark('googletagInitEnd'),
					() => {
						setPageTargeting(consentState, isSignedIn);
					},
					() => {
						// Note: this function isn't synchronous like most buffered cmds, it's a promise. It's put in here to ensure
						// it strictly follows preceding prepare-googletag work (and the module itself ensures dependencies are
						// fulfilled), but don't assume this function is complete when queueing subsequent work using cmd.push
						void fillStaticAdvertSlots();
					},
				);

				//DuckDuckGo blocks googletag request by default, creating a lot of noise in Sentry
				//This flow allows us to handle errors originating from DuckDuckGo without spamming Sentry
				loadScript(
					window.guardian.config.page.libs?.googletag ??
						'//securepubads.g.doubleclick.net/tag/js/gpt.js',
					{ async: false },
				).catch((error: Error) => {
					if (navigator.userAgent.includes('DuckDuckGo')) {
						log(
							'commercial',
							'🦆 Caught loadScript error on DuckDuckGo',
							error,
						);
					} else {
						throw error;
					}
				});
			}
			return Promise.resolve();
		});
	};

	if (commercialFeatures.shouldLoadGoogletag) {
		return (
			setupAdvertising()
				// on error, remove all slots
				.catch(removeSlots)
		);
	}

	return removeSlots();
};

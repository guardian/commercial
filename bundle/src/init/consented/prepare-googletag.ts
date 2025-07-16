import { EventTimer } from '@guardian/commercial-core/event-timer';
import type { ConsentState } from '@guardian/libs';
import { getConsentFor, loadScript, log, onConsent } from '@guardian/libs';
import { commercialFeatures } from '../../lib/commercial-features';
import { getGoogleTagId, isUserLoggedIn } from '../../lib/identity/api';
import { getPageTargeting } from '../../lib/page-targeting';
import { checkThirdPartyCookiesEnabled } from '../../lib/third-party-cookies';
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

const enableTargeting = (consentState: ConsentState) => {
	if (consentState.canTarget) {
		window.googletag.cmd.push(setPublisherProvidedId);
		window.googletag.cmd.push(setCookieDeprecationLabel);
		window.googletag.cmd.push(checkThirdPartyCookiesEnabled);
	}
};

const isGoogleTagAllowed = (consentState: ConsentState) =>
	getConsentFor('googletag', consentState);

const canRunGoogletag = (consentState: ConsentState) => {
	if (consentState.tcfv2) {
		return isGoogleTagAllowed(consentState);
	}
	return true;
};

const handleLocalePermissions = (consentState: ConsentState) => {
	if (consentState.usnat) {
		// US mode- USNAT is a general-purpose consent string for various state laws
		window.googletag.cmd.push(() => {
			window.googletag.pubads().setPrivacySettings({
				restrictDataProcessing: !consentState.canTarget,
			});
		});
	} else if (consentState.aus) {
		// AUS mode
		window.googletag.cmd.push(() => {
			window.googletag.pubads().setPrivacySettings({
				nonPersonalizedAds: !isGoogleTagAllowed(consentState),
			});
		});
	}
};

export const init = (): Promise<void> => {
	const setupAdvertising = async (): Promise<void> => {
		const consentState = await onConsent();
		EventTimer.get().mark('googletagInitStart');
		const canRun = canRunGoogletag(consentState);

		enableTargeting(consentState);
		handleLocalePermissions(consentState);

		// Prebid will already be loaded, and window.googletag is stubbed in `commercial.js`.
		// Just load googletag - it's already added to the window by Prebid.
		if (canRun) {
			const isSignedIn = await isUserLoggedIn();
			window.googletag.cmd.push(
				() => EventTimer.get().mark('googletagInitEnd'),
				() => setPageTargeting(consentState, isSignedIn),
				// Note: this function isn't synchronous like most buffered cmds, it's a promise. It's put in here to ensure
				// it strictly follows preceding prepare-googletag work (and the module itself ensures dependencies are
				// fulfilled), but don't assume this function is complete when queueing subsequent work using cmd.push
				() => void fillStaticAdvertSlots(),
			);

			// The DuckDuckGo browser blocks ads from loading by default, so it causes a lot of noise in Sentry.
			// We filter these errors out here - DuckDuckGo is in the user agent string if someone is using the
			// desktop browser, and Ddg is present for those using the mobile browser, so we filter out both.
			loadScript(
				window.guardian.config.page.libs?.googletag ??
					'//securepubads.g.doubleclick.net/tag/js/gpt.js',
				{ async: false },
			).catch((error: Error) => {
				if (
					navigator.userAgent.includes('DuckDuckGo') ||
					navigator.userAgent.includes('Ddg')
				) {
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

import { onConsent } from '@guardian/libs';
import { isUserLoggedIn } from '../../lib/identity/api';
import { getPageTargeting } from '../../lib/page-targeting';

/**
 * When users navigate backwards or forwards in their browser history, Ophan generates a new page view
 * due to the pages being cached (see `bfcache`)
 *
 * This function listens for the `pageshow` event and resets the page targeting when event.persisted
 * is true, as this represents when the page has been served from cache
 * This is to ensure that ad targeting is set up to match the correct pageview ID
 */
const handleBfcache = async (): Promise<void> => {
	const isSignedIn = await isUserLoggedIn();
	const consentState = await onConsent();

	window.addEventListener('pageshow', (event) => {
		// If bfcache used, refresh the page targeting
		if (event.persisted) {
			Object.entries(getPageTargeting(consentState, isSignedIn)).forEach(
				([key, value]) => {
					if (!value) return;
					window.googletag.pubads().setTargeting(key, value);
				},
			);
		}
	});

	return Promise.resolve();
};

export { handleBfcache };

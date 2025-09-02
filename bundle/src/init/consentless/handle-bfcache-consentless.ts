import type { ConsentState } from '@guardian/libs';
import { isUserLoggedIn } from '../../lib/identity/api';
import { setOptOutTargeting } from './prepare-ootag';

/**
 * When users navigate backwards or forwards in their browser history, Ophan generates a new page view
 * due to the pages being cached (see `bfcache`)
 *
 * This function listens for the `pageshow` event and resets the page targeting when event.persisted
 * is true, as this represents when the page has been served from cache
 * This is to ensure that ad targeting is set up to match the correct pageview ID
 */
const handleBfcacheConsentless = async (
	consentState: ConsentState,
): Promise<void> => {
	const isSignedIn = await isUserLoggedIn();

	window.addEventListener('pageshow', (event) => {
		// If bfcache used, refresh the page targeting
		if (event.persisted) {
			// Same logic as in prepare-ootag
			setOptOutTargeting(consentState, isSignedIn);
		}
	});

	return Promise.resolve();
};

export { handleBfcacheConsentless };

import { onConsent } from '@guardian/libs';
import { isUserLoggedIn } from '../../lib/identity/api';
import { getPageTargeting } from '../../lib/page-targeting';

/**
 * An event listener for the `pageshow` event, which happens each time a page is loaded.
 * This event is fired for both
 * We force a refresh of ads when users navigate backwards or forwards in their browser history
 * due to the pages being cached (see `bfcache`)
 *
 * Ophan generates a new page view each time on back or forward in browser history so we need to refresh
 * ads to make sure that ad impressions match the correct pageview ID
 */
const refreshAdsBfcache = async (): Promise<void> => {
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

			// if (window.guardian.config.page.pageAdTargeting) {
			// 	window.guardian.config.page.pageAdTargeting.pv =
			// 		window.guardian.config.ophan.pageViewId;
			// }
			// window.googletag
			// 	.pubads()
			// 	.setTargeting('pv', window.guardian.config.ophan.pageViewId);
		}

		console.log('=====> pageshow event ', { persisted: event.persisted });
		console.log(
			'=====> window.guardian.ophan.viewId',
			window.guardian.ophan?.viewId,
		);
		console.log(
			'=====> window.guardian.ophan.pageViewId',
			window.guardian.ophan?.pageViewId,
		);
		console.log(
			'=====> window.guardian.config.ophan.pageViewId',
			window.guardian.config.ophan.pageViewId,
		);
		console.log(
			'=====> window.guardian.config.page.pageAdTargeting.pv',
			window.guardian.config.page.pageAdTargeting?.pv,
		);
	});

	return Promise.resolve();
};

export { refreshAdsBfcache };

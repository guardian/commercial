/**
 * An event listener for the `pageshow` event, which happens each time a page is loaded.
 * This event is fired for both
 * We force a refresh of ads when users navigate backwards or forwards in their browser history
 * due to the pages being cached (see `bfcache`)
 *
 * Ophan generates a new page view each time on back or forward in browser history so we need to refresh
 * ads to make sure that ad impressions match the correct pageview ID
 */
const refreshAdsBfcache = (): Promise<void> => {
	// window.addEventListener(
	// 	'pageshow',
	// 	function (event) {
	// 		if (event.persisted) {
	// 			// This is when users navigate backwards or forwards in their browser history
	// 		}
	// 	},
	// 	false,
	// );

	// if (isUserInVariant(bfcache, 'variant')) {
	window.addEventListener('pageshow', (event) => {
		if (window.guardian.config.page.pageAdTargeting) {
			window.guardian.config.page.pageAdTargeting.pv =
				window.guardian.config.ophan.pageViewId;
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
	// }

	return Promise.resolve();
};

export { refreshAdsBfcache };

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

	window.addEventListener('pageshow', (event) => {
		console.log('=====> OPHAN PAGE VIEW ID', window.guardian.ophan?.viewId);
		console.log(
			'=====> TARGETING PAGE VIEW ID',
			window.guardian.config.page.pageAdTargeting?.pv,
		);
		console.log('=====> PAGE SHOW EVENT. persisted? ', event.persisted);

		// Force ads to refresh on the page
		console.log('=====> FORCING REFRESH OF ADS');
		googletag.pubads().refresh();
	});

	return Promise.resolve();
};

export { refreshAdsBfcache };

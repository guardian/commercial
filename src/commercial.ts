import { getConsentFor, onConsent } from '@guardian/libs';
import { commercialFeatures } from 'lib/commercial-features';

const { frontendAssetsFullURL, page } = window.guardian.config;

const decideAssetsPath = () => {
	if (process.env.OVERRIDE_BUNDLE_PATH) {
		return process.env.OVERRIDE_BUNDLE_PATH;
	}
	const assetsPath = frontendAssetsFullURL ?? page.assetsPath;
	return `${assetsPath}javascripts/commercial/`;
};

__webpack_public_path__ = decideAssetsPath();

/**
 * Choose whether to launch Googletag or Opt Out tag (ootag) based on consent state
 */
void (async () => {
	const consentState = await onConsent();
	// Only load the Opt Out tag if:
	// - Opt Out switch is on
	// - in TCF region
	// - no consent for Googletag
	// - the user is not a subscriber
	if (
		window.guardian.config.switches.optOutAdvertising &&
		consentState.tcfv2 &&
		!getConsentFor('googletag', consentState) &&
		!commercialFeatures.adFree
	) {
		void import(
			/* webpackChunkName: "consentless" */
			'./init/consentless'
		).then(({ bootConsentless }) => bootConsentless(consentState));
	} else {
		void import(
			/* webpackChunkName: "consented" */
			'./init/consented'
		).then(({ bootCommercialWhenReady }) => bootCommercialWhenReady());
	}
})();

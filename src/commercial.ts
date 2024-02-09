// import {
// 	getConsentFor,
// 	onConsent,
// } from '@guardian/consent-management-platform';
// import { bootCommercialWhenReady } from 'init/consented';
import { initElementsManager } from 'init/consented/prepare-elements-manager';
// import { commercialFeatures } from 'lib/commercial-features';

// /**
//  * Choose whether to launch Googletag or Opt Out tag (ootag) based on consent state
//  */
// const chooseAdvertisingTag = async () => {
// 	const consentState = await onConsent();
// 	// Only load the Opt Out tag if:
// 	// - in TCF region
// 	// - no consent for Googletag
// 	// - the user is not a subscriber
// 	if (
// 		consentState.tcfv2 &&
// 		!getConsentFor('googletag', consentState) &&
// 		!commercialFeatures.adFree
// 	) {
// 		void import(
// 			/* webpackChunkName: "consentless" */
// 			'./init/consentless'
// 		).then(({ bootConsentless }) => bootConsentless(consentState));
// 	} else {
// 		bootCommercialWhenReady();
// 	}
// };

// /**
//  * If the consentless switch is on decide whether to boot consentless or normal consented
//  * If the consentless switch is off boot normal consented
//  */
// if (window.guardian.config.switches.optOutAdvertising) {
// 	void chooseAdvertisingTag();
// } else {
// 	bootCommercialWhenReady();
// }

void initElementsManager();

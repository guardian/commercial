import { cmp, getConsentFor, onConsent, onConsentChange } from '@guardian/libs';
import type { ConsentState } from '@guardian/libs';

export const init = async (): Promise<void> => {
	const consentState: ConsentState = await onConsent();
	console.log(`CMP Test Module: ${JSON.stringify(consentState)}`);

	console.log(
		`CMP Test Module: getConsentFor googletag: ${getConsentFor('googletag', consentState)}`,
	);
	console.log(
		`CMP Test Module: get Consent for id5: ${getConsentFor('id5', consentState)}`,
	);

	console.log(`CMP Test Module: cmp.hasInitialised: ${cmp.hasInitialised()}`);
	console.log(
		`CMP Test Module: cmp.willShowPrivacyMessageSync: ${cmp.willShowPrivacyMessageSync()}`,
	);

	onConsentChange((consent) => {
		console.log(
			`CMP Test Module: onConsentChange: ${JSON.stringify(consent)}`,
		);
	}, true);
};

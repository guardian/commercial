import {
	type ConsentState,
	getConsentFor,
	type VendorName,
} from '@guardian/libs';

/**
 * Helper function to check consent for a known TCF vendor that also
 * takes into account global consent frameworks (USNAT & AUS)
 * */
export const hasConsentFor = (
	vendorName: VendorName,
	consentState: ConsentState,
): boolean => {
	switch (consentState.framework) {
		case 'tcfv2':
			return getConsentFor(vendorName, consentState);
		case 'aus':
			return !!consentState.aus?.personalisedAdvertising;
		case 'usnat':
			return !consentState.usnat?.doNotSell;
		default:
			return false;
	}
};

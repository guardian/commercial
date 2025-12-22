import type { ConsentState } from '@guardian/libs';
import type { ConsentManagement } from './types';

export const consentManagement = (
	consentState: ConsentState,
): ConsentManagement => {
	switch (consentState.framework) {
		/** @see https://docs.prebid.org/dev-docs/modules/consentManagementUsp.html */
		case 'aus':
			return {
				usp: {
					cmpApi: 'iab',
					timeout: 1500,
				},
			};
		/** @see https://docs.prebid.org/dev-docs/modules/consentManagementGpp.html */
		case 'usnat':
			return {
				gpp: {
					cmpApi: 'iab',
					timeout: 1500,
				},
			};
		/** @see https://docs.prebid.org/dev-docs/modules/consentManagementTcf.html */
		case 'tcfv2':
		default:
			return {
				gdpr: {
					cmpApi: 'iab',
					timeout: 200,
					defaultGdprScope: true,
				},
			};
	}
};

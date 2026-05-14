import type { ConsentState } from '@guardian/libs';
import { getConsentFor } from '@guardian/libs';
import type { AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import {
	EU_PARTNER_ID,
	isUserInAllowedEURegion,
	isUserInIntentIQRegion,
	NON_EU_PARTNER_ID,
} from './id-handlers/intent-iq';

export const getIntentIQAnalyticsConfig = (
	consentState: ConsentState,
): AnalyticsConfig<'iiqAnalytics'> | undefined => {
	if (getConsentFor('intentIQ', consentState) && isUserInIntentIQRegion()) {
		return {
			provider: 'iiqAnalytics',
			options: {
				partner: isUserInAllowedEURegion()
					? EU_PARTNER_ID
					: NON_EU_PARTNER_ID,
				ABTestingConfigurationSource: 'IIQServer',
				domainName: 'theguardian.com',
				gamObjectReference: googletag,
				...(isUserInAllowedEURegion() && {
					reportingServerAddress:
						'https://reports-gdpr.intentiq.com/report',
					browserBlackList: 'chrome',
				}),
			},
		};
	}
};

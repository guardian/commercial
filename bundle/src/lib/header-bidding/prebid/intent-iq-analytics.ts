import type { ConsentState } from '@guardian/consent-manager';
import { getConsentFor } from '@guardian/consent-manager';
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
	const isEU = isUserInAllowedEURegion();
	const hasConsent = getConsentFor('intentIQ', consentState);
	const enabledAnalytics = isUserInIntentIQRegion() && hasConsent;

	if (enabledAnalytics) {
		return {
			provider: 'iiqAnalytics',
			options: {
				partner: isEU ? EU_PARTNER_ID : NON_EU_PARTNER_ID,
				ABTestingConfigurationSource: 'IIQServer',
				domainName: 'theguardian.com',
				gamObjectReference: googletag,
				...(isEU && {
					reportingServerAddress:
						'https://reports-gdpr.intentiq.com/report',
					browserBlackList: 'chrome',
				}),
			},
		};
	}
};

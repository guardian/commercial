import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import type { ConsentState } from '@guardian/consent-manager';
import { getConsentFor } from '@guardian/consent-manager';
import type { AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { isUserInTestGroup } from '../../../ab-testing';
import {
	EU_PARTNER_ID,
	isUserInAllowedEURegion,
	isUserInIntentIQRegion,
	NON_EU_PARTNER_ID,
} from './id-handlers/intent-iq';

const isUserInTestGroupIntentIQ = isUserInTestGroup(
	'commercial-user-module-intentIq',
	'variant',
);

const canRunIntentIqInUS = !isUserInTestGroup(
	'commercial-user-module-intentIq-us-region',
	'holdback',
);

export const getIntentIQAnalyticsConfig = (
	consentState: ConsentState,
): AnalyticsConfig<'iiqAnalytics'> | undefined => {
	const isEU = isUserInAllowedEURegion();
	const hasConsent = getConsentFor('intentIQ', consentState);

	const isNonUSEligible =
		isUserInTestGroupIntentIQ && isUserInIntentIQRegion();

	const isUSEligible = canRunIntentIqInUS && isInUsa();

	const enabledAnalytics = (isNonUSEligible || isUSEligible) && hasConsent;

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

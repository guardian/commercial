import type { ConsentState } from '@guardian/consent-manager';
import { getConsentFor } from '@guardian/consent-manager';
import type { AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { isSwitchedOn } from '../utils';
import { ATS_PLACEMENT_ID } from './id-handlers/liveramp';

export const getLiveRampATSAnalyticsConfig = (
	consentState: ConsentState,
): AnalyticsConfig<'atsAnalytics'> | undefined => {
	const isEnabled = isSwitchedOn('prebidLiveramp');
	const hasConsent = getConsentFor('liveramp', consentState);

	if (isEnabled && hasConsent) {
		return {
			provider: 'atsAnalytics',
			options: {
				pid: String(ATS_PLACEMENT_ID),
			},
		};
	}
};

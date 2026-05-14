import type { ConsentState } from '@guardian/libs';
import { getConsentFor } from '@guardian/libs';
import type { AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { getParticipations } from '../../../ab-testing';
import {
	EU_PARTNER_ID,
	isUserInAllowedEURegion,
	isUserInIntentIQRegion,
	NON_EU_PARTNER_ID,
} from './id-handlers/intent-iq';

const shouldEnableAnalytics = (): boolean => {
	if (!window.guardian.config.switches.prebidAnalytics) {
		return false;
	}

	// determine if the user is in the analytics sample
	const analyticsSampleRate = 10 / 100;
	const isInSample = Math.random() < analyticsSampleRate;

	// determine if the user is in any AB test
	const isInClientSideTest = Object.keys(getParticipations()).length > 0;
	const isInServerSideTest =
		Object.keys(window.guardian.config.tests ?? {}).length > 0;

	/**
	 * @todo drop old client/server side checks and use just window.guardian.modules.abTests once
	 * all tests have been migrated to the new AB testing platform
	 */
	const isInNewABTest =
		Object.keys(window.guardian.modules.abTests?.getParticipations() ?? {})
			.length > 0;

	const hasQueryParam = window.location.search.includes(
		'pbjs-analytics=true',
	);
	return (
		isInServerSideTest ||
		isInClientSideTest ||
		isInNewABTest ||
		isInSample ||
		hasQueryParam
	);
};

export const getGUAnalyticsConfig = (): AnalyticsConfig<'gu'> | undefined => {
	const pageViewId = window.guardian.ophan?.pageViewId;
	if (shouldEnableAnalytics() && pageViewId) {
		return {
			provider: 'gu',
			options: {
				pv: pageViewId,
				url:
					window.guardian.config.page.isDev ||
					window.location.hostname.includes('localhost')
						? `//performance-events.code.dev-guardianapis.com/header-bidding`
						: `//performance-events.guardianapis.com/header-bidding`,
			},
		};
	}
};

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

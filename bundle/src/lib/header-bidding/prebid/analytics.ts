import type { AnalyticsConfig } from 'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { getParticipations } from '../../../experiments/ab';

// TODO: remove once prebid is upgraded to v10
// import type { AnalyticsConfig } from '../prebid-types';

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

export const getAnalyticsConfig = (): AnalyticsConfig<'gu'> | undefined => {
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

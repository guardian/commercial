import {
	isInAustralia,
	isInUsa,
} from '@guardian/commercial-core/geo/geo-utils';
import type { GetThirdPartyTag } from '../types';

const handleQuerySurveyDone = (
	surveyAvailable: boolean,
	survey: { measurementId: string },
): void => {
	if (surveyAvailable) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- @types/googletag declares it, but it may be missing
		if (window.googletag) {
			window.googletag.cmd.push(() => {
				window.googletag.pubads().setTargeting('inizio', 't');
			});
		}
		console.log(`surveyAvailable: ${survey.measurementId}`);
	}
};

const onLoad = (): void => {
	window._brandmetrics ??= [];
	window._brandmetrics.push({
		cmd: '_querySurvey',
		val: {
			callback: handleQuerySurveyDone,
		},
	});
};

/**
 * This function matches the consent Framework
 * https://github.com/guardian/csnx/blob/f5b5bd6371e798daf76b777788ccc040cba7727f/libs/%40guardian/libs/src/consent-management-platform/getFramework.ts#L4
 */
const scriptBasedOnRegion = (): string => {
	if (isInUsa()) {
		return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_us.js';
	}

	if (isInAustralia()) {
		return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_au.js';
	}

	return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_uk.js';
};

/**
 * Allows creatives to show survey
 * https://trello.com/c/wHffHVF1/171-integrate-and-test-inizio
 * @param  {} {shouldRun}
 */
export const inizio: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: scriptBasedOnRegion(),
	name: 'inizio',
	onLoad,
});

export const _ = {
	onLoad,
	handleQuerySurveyDone,
};

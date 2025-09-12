import {
	isInAustralia,
	isInUk,
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

const scriptBasedOnRegion = (): string => {
	if (isInUk()) {
		return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_uk.js';
	}

	if (isInUsa()) {
		return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_us.js';
	}

	if (isInAustralia()) {
		return '//cdn.brandmetrics.com/tag/c3330059-9ad5-4d32-8e7a-e9f6c7d74957/the_guardian_au.js';
	}

	return '';
};

/**
 * Allows creatives to show survey
 * https://trello.com/c/wHffHVF1/171-integrate-and-test-inizio
 * @param  {} {shouldRun}
 */
export const inizio: GetThirdPartyTag = ({ shouldRun }) => {
	const url = scriptBasedOnRegion();
	return {
		shouldRun: shouldRun && url !== '',
		url,
		name: 'inizio',
		onLoad,
	};
};

export const _ = {
	onLoad,
	handleQuerySurveyDone,
};

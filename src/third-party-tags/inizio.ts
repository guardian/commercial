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
	window._brandmetrics ||= [];
	window._brandmetrics.push({
		cmd: '_querySurvey',
		val: {
			callback: handleQuerySurveyDone,
		},
	});
};

export const inizio: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//cdn.brandmetrics.com/survey/script/e96d04c832084488a841a06b49b8fb2d.js',
	name: 'inizio',
	onLoad,
});

export const _ = {
	onLoad,
	handleQuerySurveyDone,
};

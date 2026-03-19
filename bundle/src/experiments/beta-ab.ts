import { reportError } from '../lib/error/report-error';

const reportNoAbModule = () => {
	const error = Error(`'window.guardian.modules.abTests' is not set up`);
	reportError(error, 'commercial');
};

const getAbModule = () => {
	// Check if the AB testing module is available before trying to access it
	// it could be missing or not fully initialized, and we want to avoid throwing errors in those cases
	if (
		!window.guardian.modules.abTests ||
		!('getParticipations' in window.guardian.modules.abTests)
	) {
		reportNoAbModule();
		return null;
	}
	return window.guardian.modules.abTests;
};

export const getParticipations = () => {
	return getAbModule()?.getParticipations() ?? {};
};

export const isUserInTest = (testId: string) => {
	return getAbModule()?.isUserInTest(testId) ?? false;
};

export const isUserInTestGroup = (testId: string, variantId: string) => {
	return getAbModule()?.isUserInTestGroup(testId, variantId) ?? false;
};

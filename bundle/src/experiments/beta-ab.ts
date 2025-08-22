import { reportError } from '../lib/error/report-error';

const reportNoAbModule = () => {
	const error = Error('Unable to access abTests module on window.guardian');
	reportError(error, 'commercial');
};

export const getParticipations = () => {
	if (!window.guardian.modules.abTests) {
		reportNoAbModule();
		return {};
	}

	return window.guardian.modules.abTests.getParticipations();
};

export const isUserInTest = (testId: string) => {
	if (!window.guardian.modules.abTests) {
		reportNoAbModule();
		return false;
	}

	return window.guardian.modules.abTests.isUserInTest(testId);
};

export const isUserInTestGroup = (testId: string, variantId: string) => {
	if (!window.guardian.modules.abTests) {
		reportNoAbModule();
		return false;
	}

	return window.guardian.modules.abTests.isUserInTestGroup(testId, variantId);
};

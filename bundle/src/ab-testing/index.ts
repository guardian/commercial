import { reportError } from '../lib/error/report-error';

const reportNoAbModule = () => {
	const error = Error('Unable to access abTests module on window.guardian');
	reportError(error, 'commercial');
};

export const getParticipations = () => {
	// This variable is deliberately not extracted to the top level to give further insurance against the possible race condition
	const abGetParticipations =
		window.guardian.modules.abTests?.getParticipations;

	if (!abGetParticipations) {
		reportNoAbModule();
		return {};
	}

	return abGetParticipations();
};

export const isUserInTest = (testId: string) => {
	const abIsUserInTest = window.guardian.modules.abTests?.isUserInTest;

	if (!abIsUserInTest) {
		reportNoAbModule();
		return false;
	}

	return abIsUserInTest(testId);
};

export const isUserInTestGroup = (testId: string, variantId: string) => {
	const abIsUserInTestGroup =
		window.guardian.modules.abTests?.isUserInTestGroup;

	if (!abIsUserInTestGroup) {
		reportNoAbModule();
		return false;
	}

	return abIsUserInTestGroup(testId, variantId);
};

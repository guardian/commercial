import { reportError } from '../lib/error/report-error';

const reportNoAbModule = (path: string) => {
	const error = Error(`Unable to access 'window.guardian.modules.${path}'`);
	reportError(error, 'commercial');
};

export const getParticipations = () => {
	// This variable is deliberately not extracted to the top level to give further insurance against the possible race condition
	const abGetParticipations =
		window.guardian.modules.abTests?.getParticipations;

	if (!abGetParticipations) {
		reportNoAbModule('abTests.getParticipations');
		return {};
	}

	return abGetParticipations();
};

export const isUserInTest = (testId: string) => {
	const abIsUserInTest = window.guardian.modules.abTests?.isUserInTest;

	if (!abIsUserInTest) {
		reportNoAbModule('abTests.isUserInTest');
		return false;
	}

	return abIsUserInTest(testId);
};

export const isUserInTestGroup = (testId: string, variantId: string) => {
	const abIsUserInTestGroup =
		window.guardian.modules.abTests?.isUserInTestGroup;

	if (!abIsUserInTestGroup) {
		reportNoAbModule('abTests.isUserInTestGroup');
		return false;
	}

	return abIsUserInTestGroup(testId, variantId);
};

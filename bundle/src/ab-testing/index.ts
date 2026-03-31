import { reportError } from '../lib/error/report-error';

const reportNoAbModule = () => {
	const error = Error('Unable to access abTests module on window.guardian');
	reportError(error, 'commercial');
};

export const getParticipations = () => {
	// This variable is deliberately not extracted to the top level to give further insurance against the possible race condition
	const abModule = window.guardian.modules.abTests;

	if (!abModule) {
		reportNoAbModule();
		return {};
	}

	return abModule.getParticipations();
};

export const isUserInTest = (testId: string) => {
	const abModule = window.guardian.modules.abTests;

	if (!abModule) {
		reportNoAbModule();
		return false;
	}

	return abModule.isUserInTest(testId);
};

export const isUserInTestGroup = (testId: string, variantId: string) => {
	const abModule = window.guardian.modules.abTests;

	if (!abModule) {
		reportNoAbModule();
		return false;
	}

	return abModule.isUserInTestGroup(testId, variantId);
};

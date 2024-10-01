import { reportError } from './report-error';

describe('report-error', () => {
	const error = new Error('Something broke');
	const tags = { test: 'testValue' };

	test('Calls window.guardian.modules.sentry.reportError', () => {
		reportError(error, 'commercial', tags);
		expect(
			window.guardian.modules.sentry?.reportError as jest.Mock,
		).toHaveBeenCalledWith(error, 'commercial', tags);
	});

	test('Converts error if of an unknown type', () => {
		reportError('unknown', 'commercial', tags);
		expect(
			window.guardian.modules.sentry?.reportError as jest.Mock,
		).toHaveBeenCalledWith(expect.any(Error), 'commercial', tags);
	});
});

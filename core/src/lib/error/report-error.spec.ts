import { reportError } from './report-error';

describe('report-error', () => {
	const error = new Error('Deliberate test error');
	const tags = { test: 'testValue' };
	const extras = { test: 'testExtraValue' };

	test('Calls window.guardian.modules.sentry.reportError', () => {
		reportError(error, 'commercial', tags, extras);
		expect(
			window.guardian.modules.sentry?.reportError as jest.Mock,
		).toHaveBeenCalledWith(error, 'commercial', tags, extras);
	});

	test('Converts error if of an unknown type', () => {
		reportError('unknown', 'commercial', tags, extras);
		expect(
			window.guardian.modules.sentry?.reportError as jest.Mock,
		).toHaveBeenCalledWith(expect.any(Error), 'commercial', tags, extras);
	});
});

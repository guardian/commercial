import { reportError } from './report-error';

describe('report-error', () => {
	beforeEach(() => {
		jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
	});

	afterEach(() => {
		jest.spyOn(global.Math, 'random').mockRestore();
		jest.resetAllMocks();
	});

	const error = new Error('Something broke.');
	const tags = 'testValue';

	test('Does NOT throw an error', () => {
		expect(() => {
			reportError(error, tags);
		}).not.toThrowError(error);
	});

	test('Applies a sampling rate that prevents a sample of errors being reporting', () => {
		reportError(error, tags);
	});
});

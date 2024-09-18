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
	const tags = { test: 'testValue' };

	test('Does NOT throw an error', () => {
		expect(() => {
			reportError(error, 'commercial', tags);
		}).not.toThrowError(error);
	});
});

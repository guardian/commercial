import { reportError } from 'utils/report-error';
import { catchErrorsAndReport } from './robust';
import type { Modules } from './robust';

jest.mock('utils/report-error', () => ({
	reportError: jest.fn(),
}));

beforeEach(() => {
	jest.spyOn(global.console, 'warn');
});

afterEach(() => {
	jest.spyOn(global.console, 'warn').mockRestore();
	jest.resetAllMocks();
});

describe('robust', () => {
	const ERROR = new Error('Deliberate test error');
	const tags = { tag: 'test' };

	const throwError = () => {
		throw ERROR;
	};

	test('catchErrorsAndReport with no errors', () => {
		const runner = jest.fn();

		const modules = [
			['test-1', runner],
			['test-2', runner],
			['test-3', runner],
		] as Modules;

		catchErrorsAndReport(modules);
		expect(runner).toHaveBeenCalledTimes(modules.length);
		expect(reportError).not.toHaveBeenCalled();
	});

	test('catchErrorsAndReport with one error', () => {
		const runner = jest.fn();

		const modules = [
			['test-1', runner],
			['test-2', throwError],
			['test-3', runner],
		] as Modules;

		catchErrorsAndReport(modules, tags);
		expect(runner).toHaveBeenCalledTimes(2);
		expect(reportError).toHaveBeenCalledTimes(1);
		expect(window.console.warn).toHaveBeenCalledTimes(1);
		expect(reportError).toHaveBeenCalledWith(ERROR, 'commercial', {
			tag: 'test',
			module: 'test-2',
		});
	});
});

/*
Swallows (and reports) exceptions. Designed to wrap around modules at the "bootstrap" level.
For example "comments throwing an exception should not stop auto refresh"
*/

import { reportError } from 'utils/report-error';

type ModuleFunction = () => void;
type Module = [string, ModuleFunction];
type Modules = Module[];

const catchErrors = (fn: ModuleFunction): Error | undefined => {
	let error: Error | undefined;

	try {
		fn();
	} catch (e) {
		error = e instanceof Error ? e : new Error(String(e));
	}

	return error;
};

const logError = (
	moduleName: string,
	error: Error,
	tags?: Record<string, string>,
): void => {
	window.console.warn('Caught error.', error.stack);
	reportError(error, 'commercial', { ...tags, module: moduleName });
};

const catchAndLogError = (
	name: string,
	fn: ModuleFunction,
	tags?: Record<string, string>,
): void => {
	const error = catchErrors(fn);

	if (error) {
		logError(name, error, tags);
	}
};

const catchErrorsWithContext = (
	modules: Modules,
	tags?: Record<string, string>,
): void => {
	modules.forEach(([name, fn]) => catchAndLogError(name, fn, tags));
};

export { catchErrorsWithContext };
export type { Modules };
export const _ = { catchAndLogError };

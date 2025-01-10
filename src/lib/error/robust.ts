/**
 * Swallows and reports exceptions. Designed to wrap around modules at the "bootstrap" level.
 */
import { reportError } from './report-error';

type ModuleFunction = () => void;
type Module = [string, ModuleFunction];
type Modules = Module[];

const catchErrorsAndReport = (
	modules: Modules,
	tags?: Record<string, string>,
): void => {
	modules.forEach(([name, fn]) => {
		let error: Error | undefined;

		try {
			fn();
		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
		}

		if (error) {
			window.console.warn('Caught error.', error.stack);
			reportError(error, 'commercial', { ...tags, module: name });
		}
	});
};

export { catchErrorsAndReport };
export type { Modules };

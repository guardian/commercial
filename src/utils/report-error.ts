/**
 * This function is used to report errors to Sentry
 * This uses the `reportError` function from the `window.guardian.modules.sentry` object set by DCR
 */
const reportError = (
	error: unknown,
	feature: string,
	tags: Record<string, string> = {},
) => {
	try {
		const err = error instanceof Error ? error : new Error(String(error));
		if (window.guardian.modules.sentry?.reportError) {
			window.guardian.modules.sentry.reportError(err, feature, tags);
		}
	} catch (e) {
		console.error('Error reporting error to Sentry', e, feature, tags);
	}
};

type ErrorReportingFunction<T> = (event: T) => void;

const wrapWithErrorReporting = <T>(
	fn: ErrorReportingFunction<T>,
	tags: Record<string, string> = {},
): ErrorReportingFunction<T> => {
	return function (event: T) {
		try {
			fn(event);
		} catch (e) {
			if (e instanceof Error) {
				reportError(e, 'commercial', tags);
			}
		}
	};
};

export { reportError, wrapWithErrorReporting };

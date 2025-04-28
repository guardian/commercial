/**
 * This function is used to report errors to Sentry
 * It uses the function `window.guardian.modules.sentry.reportError` set by DCR
 */
const reportError = (
	error: unknown,
	feature: string,
	tags: Record<string, string> = {},
	extras: Record<string, unknown> = {},
) => {
	try {
		const err = error instanceof Error ? error : new Error(String(error));
		if (window.guardian.modules.sentry?.reportError) {
			window.guardian.modules.sentry.reportError(
				err,
				feature,
				tags,
				extras,
			);
		}
	} catch (e) {
		console.error('Error reporting error to Sentry', e, feature, tags);
	}
};

type ErrorReportingFunction<T> = (event: T) => void;

const wrapWithErrorReporting = <T>(
	fn: ErrorReportingFunction<T>,
	tags: Record<string, string> = {},
	extras: Record<string, unknown> = {},
): ErrorReportingFunction<T> => {
	return function (event: T) {
		try {
			fn(event);
		} catch (e) {
			reportError(e, 'commercial', tags, extras);
		}
	};
};

export { reportError, wrapWithErrorReporting };

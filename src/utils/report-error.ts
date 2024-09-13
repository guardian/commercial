// This function is used to report errors to Sentry.
// This uses the `reportError` function from the `window.guardian.modules.sentry` object.
const reportError = window.guardian.modules.sentry.reportError;

type ErrorReportingFunction<T> = (event: T) => void;

const wrapWithErrorReporting = <T>(
	fn: ErrorReportingFunction<T>,
	tags: Record<string, string> = {},
): ErrorReportingFunction<T> => {
	return function (event: T) {
		try {
			fn(event);
		} catch (e) {
			reportError(e, JSON.stringify(tags));
		}
	};
};

export { reportError, wrapWithErrorReporting };

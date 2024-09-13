// The report error function replace the older Raven based error reporting with the new Sentry based error reporting.
// This function is used to report errors to Sentry.
// This uses the `reportError` function from the `window.guardian.modules.sentry` object.
export const reportError = window.guardian.modules.sentry.reportError;

export const wrapWithErrorReporting = (
	fn: (...args: unknown[]) => void,
	tags: Record<string, string> = {},
) => {
	return function (...args: unknown[]) {
		try {
			fn(...args);
		} catch (e) {
			reportError(e, JSON.stringify(tags));
		}
	};
};

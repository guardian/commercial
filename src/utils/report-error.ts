// The report error function replace the older Raven based error reporting with the new Sentry based error reporting.
// This function is used to report errors to Sentry.
// This uses the `reportError` function from the `window.guardian.modules.sentry` object.
export const reportError = window.guardian.modules.sentry.reportError;

export const trackEvent = (
	timingCategory: string,
	timingVar: string,
	timingLabel: string,
): void => {
	const { ga, guardian } = window;
	const trackerName: string | undefined =
		guardian.config.googleAnalytics?.trackers.editorial;

	if (typeof ga !== 'function') {
		return;
	}
	const timeSincePageLoad: number = Math.round(window.performance.now());

	const send = trackerName ? `${trackerName}.send` : 'send';
	window.ga(
		send,
		'timing',
		timingCategory,
		timingVar,
		timeSincePageLoad,
		timingLabel,
	);
};

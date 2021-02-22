export const trackEvent = (
	timingCategory: string,
	timingVar: string,
	timingLabel: string,
): void => {
	const { ga, guardian } = window;
	const trackerName: string | undefined =
		guardian.config?.googleAnalytics?.trackers.editorial;
	if (typeof ga === 'undefined' || typeof trackerName === 'undefined') {
		console.error(
			"Can't track GA event - GA library not loaded or no tracker found",
		);
		return;
	}
	const timeSincePageLoad: number = Math.round(window.performance.now());

	const send = `${trackerName}.send`;
	window.ga(
		send,
		'timing',
		timingCategory,
		timingVar,
		timeSincePageLoad,
		timingLabel,
	);
};

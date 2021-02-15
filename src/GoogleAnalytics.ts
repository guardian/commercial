export const trackEvent = (
	timingCategory: string,
	timingVar: string,
	timingLabel: string,
	trackerName: string,
): void => {
	const { ga } = window;

	if (typeof ga === 'undefined') {
		console.error("Can't track GA event - GA library not loaded");
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

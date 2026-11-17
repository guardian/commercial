export const isAdServingReady = (callback: () => void): void => {
	if (window.onDvtagReady) {
		window.onDvtagReady(callback);
	} else {
		callback();
	}
};

import { installOnDvtagReady } from '../../lib/third-party-tags/doubleverify-helper';

/**
 * Initialize ad serving ready wrapper early in the commercial process.
 * This sets up the onDvtagReady handler and provides a wrapped interface for calling it.
 */

export const initAdServingReady = async (): Promise<void> => {
  installOnDvtagReady();
}

export const isAdServingReady = (callback: () => void): void => {
	if (window.onDvtagReady) {
		window.onDvtagReady(callback);
	} else {
		callback();
	}
};

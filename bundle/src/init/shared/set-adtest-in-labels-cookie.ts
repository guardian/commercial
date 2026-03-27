import { removeCookie, setCookie } from '@guardian/libs';
import { getUrlVars } from '../../lib/url';

/**
 * Not to be confused with set-adtest-cookie.ts!
 * Set or remove `adtestInLabels` cookie
 * This is used when determining whether or not to display the value of the `adtest` cookie in ad labels
 * @returns Promise
 */
export const setAdTestInLabelsCookie = (): Promise<void> => {
	const queryParams = getUrlVars();

	if (queryParams.adtestInLabels === 'clear') {
		removeCookie({ name: 'adtestInLabels' });
	} else if (queryParams.adtestInLabels) {
		setCookie({
			name: 'adtestInLabels',
			value: 'true',
		});
	}

	return Promise.resolve();
};

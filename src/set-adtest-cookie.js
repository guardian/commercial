import {
	addCookie,
	removeCookie,
} from '@guardian/frontend/static/src/javascripts/lib/cookies';
import { getUrlVars } from '@guardian/frontend/static/src/javascripts/lib/url';

const init = () => {
	const queryParams = getUrlVars();

	if (queryParams.adtest === 'clear') {
		removeCookie('adtest');
	} else if (queryParams.adtest) {
		addCookie('adtest', encodeURIComponent(queryParams.adtest), 10);
	}
	return Promise.resolve();
};

export { init };

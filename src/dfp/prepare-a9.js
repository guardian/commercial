import {
	getConsentFor,
	onConsentChange,
} from '@guardian/consent-management-platform';
import config from '@guardian/frontend/static/src/javascripts/lib/config';
import { isGoogleProxy } from '@guardian/frontend/static/src/javascripts/lib/detect';
import { commercialFeatures } from '@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/commercial-features';
import once from 'lodash/once';
import { initialise } from '../header-bidding/a9/a9';
import { shouldIncludeOnlyA9 } from '../header-bidding/utils';
import { dfpEnv } from './dfp-env';

const setupA9 = () => {
	// There are two articles that InfoSec would like to avoid loading scripts on
	if (commercialFeatures.isSecureContact) {
		return Promise.resolve();
	}

	let moduleLoadResult = Promise.resolve();
	if (
		shouldIncludeOnlyA9 ||
		(dfpEnv.hbImpl.a9 &&
			commercialFeatures.dfpAdvertising &&
			!commercialFeatures.adFree &&
			!config.get('page.hasPageSkin') &&
			!isGoogleProxy())
	) {
		moduleLoadResult = import('lib/a9-apstag.js').then(() => {
			initialise();

			return Promise.resolve();
		});
	}

	return moduleLoadResult;
};

const setupA9Once = once(setupA9);

export const init = () => {
	onConsentChange((state) => {
		if (getConsentFor('a9', state)) {
			setupA9Once();
		}
	});

	return Promise.resolve();
};

export const _ = {
	setupA9,
};

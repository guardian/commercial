import {
	getConsentFor,
	onConsent,
} from '@guardian/consent-management-platform';
import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import { a9Apstag } from 'core/__vendor/a9-apstag';
import { isGoogleProxy } from 'detect/detect-google-proxy';
import { commercialFeatures } from 'lib/commercial-features';
import { isInCanada } from 'utils/geo-utils';
import { a9 } from '../../header-bidding/a9/a9';
import { shouldIncludeOnlyA9 } from '../../header-bidding/utils';

const shouldLoadA9 = () =>
	// There are two articles that InfoSec would like to avoid loading scripts on
	!commercialFeatures.isSecureContact &&
	!isGoogleProxy() &&
	window.guardian.config.switches.a9HeaderBidding &&
	commercialFeatures.shouldLoadGoogletag &&
	!commercialFeatures.adFree &&
	!window.guardian.config.page.hasPageSkin &&
	!isInCanada();

const setupA9 = (): Promise<void | boolean> => {
	if (shouldLoadA9() || shouldIncludeOnlyA9) {
		// Load a9 third party stub
		a9Apstag();

		a9.initialise();
	}

	return Promise.resolve();
};

const setupA9Once = once(setupA9);

/**
 * Initialise A9, Amazon header bidding library
 * https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/display.html
 */
export const init = (): Promise<void | boolean> =>
	onConsent()
		.then((consentState) => {
			if (getConsentFor('a9', consentState)) {
				return setupA9Once();
			}
			throw Error('No consent for a9');
		})
		.catch((e) => {
			log('commercial', '⚠️ Failed to execute a9', e);
		});

export const _ = {
	setupA9,
};

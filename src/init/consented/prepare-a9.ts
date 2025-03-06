import { getConsentFor, log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
import { a9Apstag } from '../../lib/__vendor/a9-apstag';
import { commercialFeatures } from '../../lib/commercial-features';
import { isGoogleProxy } from '../../lib/detect/detect-google-proxy';
import { isInCanada } from '../../lib/geo/geo-utils';
import { a9 } from '../../lib/header-bidding/a9/a9';
import { shouldIncludeOnlyA9 } from '../../lib/header-bidding/utils';

const shouldLoadA9 = () =>
	// There are two articles that InfoSec would like to avoid loading scripts on
	(!commercialFeatures.isSecureContact &&
		!isGoogleProxy() &&
		window.guardian.config.switches.a9HeaderBidding &&
		commercialFeatures.shouldLoadGoogletag &&
		!commercialFeatures.adFree &&
		!window.guardian.config.page.hasPageSkin &&
		!isInCanada()) ??
	false;

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

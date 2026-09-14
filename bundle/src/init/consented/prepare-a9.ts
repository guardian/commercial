import { getConsentFor, onConsent } from '@guardian/consent-manager';
import { log } from '@guardian/libs';
import { once } from 'lodash-es';
import { a9Apstag } from '../../lib/__vendor/a9-apstag';
import { a9 } from '../../lib/header-bidding/a9/a9';
import {
	shouldIncludeOnlyA9,
	shouldLoadA9,
} from '../../lib/header-bidding/utils';

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
export const prepareA9 = (): Promise<void | boolean> =>
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

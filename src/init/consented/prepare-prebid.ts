import type { ConsentState } from '@guardian/libs';
import { log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
import { isUserInVariant } from '../../experiments/ab';
import { prebid946 } from '../../experiments/tests/prebid946';
import { commercialFeatures } from '../../lib/commercial-features';
import { isGoogleProxy } from '../../lib/detect/detect-google-proxy';
import { isInCanada } from '../../lib/geo/geo-utils';
import { prebid } from '../../lib/header-bidding/prebid/prebid';
import { shouldIncludeOnlyA9 } from '../../lib/header-bidding/utils';

const shouldLoadPrebid = () =>
	!isGoogleProxy() &&
	window.guardian.config.switches.prebidHeaderBidding &&
	commercialFeatures.shouldLoadGoogletag &&
	!commercialFeatures.adFree &&
	!window.guardian.config.page.hasPageSkin &&
	!shouldIncludeOnlyA9 &&
	!isInCanada();

const shouldLoadPrebid946 = isUserInVariant(prebid946, 'variant');

console.log('*** shouldLoadPrebid946 ***', shouldLoadPrebid946);

const loadPrebid = async (consentState: ConsentState): Promise<void> => {
	if (shouldLoadPrebid()) {
		if (shouldLoadPrebid946) {
			console.log('*** load Prebid 946 ***');
			await import(
				/* webpackChunkName: "Prebid946.js" */
				`../../lib/header-bidding/prebid/pbjs946`
			);
		} else {
			console.log('*** load Prebid 927 ***');
			await import(
				/* webpackChunkName: "Prebid.js" */
				`../../lib/header-bidding/prebid/pbjs`
			);
		}
		prebid.initialise(window, consentState);
	}
};

const throwIfUnconsented = (hasConsentForPrebid: boolean): void => {
	log('commercial', 'Prebid consent:', {
		hasConsentForPrebid,
	});

	if (!hasConsentForPrebid) {
		throw new Error('No consent for prebid');
	}
};

const setupPrebid = async (): Promise<void> => {
	try {
		const consentState = await onConsent();

		if (!consentState.framework) {
			throw new Error('Unknown framework');
		}

		switch (consentState.framework) {
			case 'aus':
				throwIfUnconsented(!!consentState.aus?.personalisedAdvertising);
				break;
			case 'usnat':
				throwIfUnconsented(!consentState.usnat?.doNotSell);
				break;
			case 'tcfv2':
				// We do per-vendor checks for this framework, no requirement for a top-level check for Prebid
				break;
		}
		return loadPrebid(consentState);
	} catch (err: unknown) {
		const error = err as Error;
		log('commercial', '⚠️ Failed to execute prebid', error.message);
	}
};

export const setupPrebidOnce: () => Promise<void> = once(setupPrebid);

/**
 * Initialise prebid - header bidding for display and video ads
 * https://docs.prebid.org/overview/intro.html
 * @returns Promise
 */
export const init = (): Promise<void> => setupPrebidOnce();

export const _ = {
	setupPrebid,
};

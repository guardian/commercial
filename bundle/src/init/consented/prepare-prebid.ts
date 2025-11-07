import { isInCanada } from '@guardian/commercial-core/geo/geo-utils';
import type { ConsentState } from '@guardian/libs';
import { log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
import { commercialFeatures } from '../../lib/commercial-features';
import { isGoogleProxy } from '../../lib/detect/detect-google-proxy';
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

let loadNewVersion: boolean = false;

const loadPrebid = async (consentState: ConsentState): Promise<void> => {
	// double check that we should load prebid
	if (!shouldLoadPrebid()) {
		return;
	}

	if (loadNewVersion) {
		await import(
			/* webpackChunkName: "Prebid@10.11.0.js" */
			'../../lib/header-bidding/prebid/pbjs-v10.11.0'
		);
	} else {
		await import(
			/* webpackChunkName: "Prebid.js" */
			'../../lib/header-bidding/prebid/pbjs'
		);
	}

	prebid.initialise(window, consentState);
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
export const init = (shouldLoadNewVersion?: boolean): Promise<void> => {
	loadNewVersion = !!shouldLoadNewVersion;
	return setupPrebidOnce();
}

export const _ = {
	setupPrebid,
};

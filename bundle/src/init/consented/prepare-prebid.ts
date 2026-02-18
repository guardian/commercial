import { isInCanada } from '@guardian/commercial-core/geo/geo-utils';
import type { ConsentState } from '@guardian/libs';
import { log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
import { isUserInTestGroup } from '../../experiments/beta-ab';
import { commercialFeatures } from '../../lib/commercial-features';
import { isGoogleProxy } from '../../lib/detect/detect-google-proxy';
import { prebid } from '../../lib/header-bidding/prebid';
import { shouldIncludeOnlyA9 } from '../../lib/header-bidding/utils';

const shouldLoadPrebid = () =>
	!isGoogleProxy() &&
	window.guardian.config.switches.prebidHeaderBidding &&
	commercialFeatures.shouldLoadGoogletag &&
	!commercialFeatures.adFree &&
	!window.guardian.config.page.hasPageSkin &&
	!shouldIncludeOnlyA9 &&
	!isInCanada();

const loadPrebid = async (consentState: ConsentState): Promise<void> => {
	// double check that we should load prebid
	if (!shouldLoadPrebid()) {
		return;
	}

	const isPrebidV10Enabled = isUserInTestGroup(
		'commercial-prebid-v10',
		'variant',
	);

	if (isPrebidV10Enabled) {
		await import(
			/* webpackChunkName: "Prebid@10.23.0.js" */
			'../../lib/header-bidding/prebid/modules-v10.23.0'
		);
	} else {
		await import(
			/* webpackChunkName: "Prebid.js" */
			'../../lib/header-bidding/prebid/modules'
		);
	}

	await prebid.initialise(window, consentState);
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
export const init = (): Promise<void> => {
	return setupPrebidOnce();
};

export const _ = {
	setupPrebid,
};

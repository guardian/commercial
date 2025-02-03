import type { ConsentFramework } from '@guardian/libs';
import { getConsentFor, log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
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

const loadPrebid = async (framework: ConsentFramework): Promise<void> => {
	if (shouldLoadPrebid()) {
		await import(
			// @ts-expect-error -- there’s no types for Prebid.js
			/* webpackChunkName: "Prebid.js" */ '@guardian/prebid.js/build/dist/prebid'
		);
		prebid.initialise(window, framework);
	}
};

const setupPrebid = async (): Promise<void> => {
	try {
		const consentState = await onConsent();

		if (!consentState.framework) {
			throw new Error('Unknown framework');
		}
		const hasConsentForGlobalPrebidVendor = getConsentFor(
			'prebid',
			consentState,
		);
		const hasConsentForCustomPrebidVendor = getConsentFor(
			'prebidCustom',
			consentState,
		);
		log('commercial', 'Prebid consent:', {
			hasConsentForGlobalPrebidVendor,
			hasConsentForCustomPrebidVendor,
		});
		if (
			// Check if we do NOT have consent to BOTH the old global and custom prebid vendor
			!hasConsentForGlobalPrebidVendor &&
			!hasConsentForCustomPrebidVendor
		) {
			throw new Error('No consent for prebid');
		}
		return loadPrebid(consentState.framework);
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

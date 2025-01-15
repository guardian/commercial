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
		await import(`./prebid`);
		prebid.initialise(window, framework);
	}
};

const setupPrebid = (): Promise<void> =>
	onConsent()
		.then((consentState) => {
			if (!consentState.framework) {
				return Promise.reject('Unknown framework');
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
				return Promise.reject('No consent for prebid');
			}
			return loadPrebid(consentState.framework);
		})
		.catch((e) => {
			log('commercial', '⚠️ Failed to execute prebid', e);
		});

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

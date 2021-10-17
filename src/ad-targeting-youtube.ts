import { onConsentChange } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { getCookie } from '@guardian/libs';
import { canUseDom } from './lib/can-use-dom';
import { constructQuery } from './lib/construct-query';
import { getPermutivePFPSegments } from './permutive';
import type {
	AdsConfig,
	AdsConfigBasic,
	AdsConfigCCPAorAus,
	AdsConfigDisabled,
	AdsConfigTCFV2,
} from './types';

type MaybeArray<T> = T[] | T;

type CustomParams = Record<string, MaybeArray<string | number | boolean>>;

const buildCustomParamsFromCookies = (): CustomParams =>
	canUseDom()
		? {
				permutive: getPermutivePFPSegments(),
				si: getCookie({ name: 'GU_U' }) ? 't' : 'f',
		  }
		: {};

const buildAdsConfig = (
	cmpConsent: ConsentState,
	adUnit: string,
	customParams: CustomParams,
): AdsConfig => {
	const mergedCustomParams = {
		...customParams,
		...buildCustomParamsFromCookies(),
	};

	const defaultAdsConfig: AdsConfigBasic = {
		adTagParameters: {
			iu: adUnit,
			// TODO: Why are we double encoding? Following Frontend process for now
			cust_params: encodeURIComponent(constructQuery(mergedCustomParams)),
		},
	};

	if (cmpConsent.ccpa) {
		const canTarget = !cmpConsent.ccpa.doNotSell;
		return {
			...defaultAdsConfig,
			restrictedDataProcessor: !canTarget,
		} as AdsConfigCCPAorAus;
	}

	if (cmpConsent.aus) {
		const canTarget = cmpConsent.aus.personalisedAdvertising;
		return {
			...defaultAdsConfig,
			restrictedDataProcessor: !canTarget,
		} as AdsConfigCCPAorAus;
	}

	const tcfData = cmpConsent.tcfv2;
	// ConsentState type allows for an undefined tcfv2
	if (tcfData) {
		const canTarget = Object.values(tcfData.consents).every(Boolean);
		const mergedAdTagParameters = {
			...defaultAdsConfig.adTagParameters,
			cmpGdpr: tcfData.gdprApplies ? 1 : 0,
			cmpGvcd: tcfData.addtlConsent,
			cmpVcd: tcfData.tcString,
		};
		return {
			adTagParameters: mergedAdTagParameters,
			nonPersonalizedAd: !canTarget,
		} as AdsConfigTCFV2;
	}

	// Shouldn't happen but handle if no matching framework
	return disabledAds;
};

const disabledAds: AdsConfigDisabled = { disableAds: true };

const buildAdsConfigWithConsent = async (
	isAdFreeUser: boolean,
	adUnit: string,
	customParams: CustomParams,
): Promise<AdsConfig> => {
	if (isAdFreeUser) {
		return disabledAds;
	}

	const consentState = await new Promise<ConsentState | undefined>(
		(resolve, reject) => {
			try {
				onConsentChange((cmpConsent: ConsentState) => {
					resolve(cmpConsent);
				});
			} catch (err) {
				reject(new Error('Error getting consent state'));
			}
		},
	).catch(() => undefined);

	return consentState
		? buildAdsConfig(consentState, adUnit, customParams)
		: disabledAds;
};

export { buildAdsConfigWithConsent };

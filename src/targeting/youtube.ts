import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { constructQuery } from '../lib/construct-query';
import type {
	AdsConfig,
	AdsConfigBasic,
	AdsConfigCCPAorAus,
	AdsConfigDisabled,
	AdsConfigTCFV2,
	CustomParams,
} from '../types';
import { buildPageTargeting } from './build-page-targeting';

const disabledAds: AdsConfigDisabled = { disableAds: true };

const buildAdsConfig = (
	cmpConsent: ConsentState,
	adUnit: string,
	customParams: CustomParams,
): AdsConfig => {
	const mergedCustomParams = {
		...customParams,
		...buildPageTargeting({
			consentState: cmpConsent,
			adFree: false,
			youtube: true,
		}),
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

	if (cmpConsent.tcfv2) {
		const tcfData = cmpConsent.tcfv2;
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

const buildAdsConfigWithConsent = (
	isAdFreeUser: boolean,
	adUnit: string,
	customParamsToMerge: CustomParams,
	consentState: ConsentState,
): AdsConfig => {
	if (isAdFreeUser) {
		return disabledAds;
	}
	return buildAdsConfig(consentState, adUnit, customParamsToMerge);
};

export { buildAdsConfigWithConsent, disabledAds };

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
	MaybeArray,
} from './types';

type CustomParams = Record<string, MaybeArray<string | number | boolean>>;

const disabledAds: AdsConfigDisabled = { disableAds: true };

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

/**
 * @param  {Record<string, MaybeArray<string|number|boolean>>
 * do this https://support.google.com/admanager/answer/1080597
 */
const encodeVastTagKeyValues = (
	query: Record<string, MaybeArray<string | number | boolean>>,
): string => {
	const unencodedUrl = Object.entries(query)
		.map(([key, value]) => {
			let queryValue: string;
			if (Array.isArray(value)) {
				queryValue = value.join(',');
			} else if (typeof value == 'boolean' || typeof value == 'number') {
				queryValue = value.toString();
			} else {
				queryValue = value;
			}
			return `${key}=${queryValue}`;
		})
		.join('&');
	return unencodedUrl
		.replace(/=/g, '%3D')
		.replace(/&/g, '%26')
		.replace(/,/g, '%2C');
};

const buildImaAdTagUrl = (
	adUnit: string,
	customParams: CustomParams,
): string => {
	const customParameters = {
		...customParams,
		...buildCustomParamsFromCookies(),
	};
	// const customParameters = { at: 'fixed-puppies' };
	console.log('raw cust params', customParameters);

	const queryParams = {
		// iu: adUnit,
		iu: '/59666047/theguardian.com',
		description_url: '[placeholder]', // do we need this?
		tfcd: '0',
		npa: '0',
		sz: '480x360|480x361|400x300',
		gdfp_req: '1',
		output: 'vast',
		unviewed_position_start: '1',
		env: 'vp',
		impl: 's',
		correlator: '', // do we need this?
		vad_type: 'linear',
		// vpos: 'preroll',
		cust_params: encodeVastTagKeyValues(customParameters),
	};

	console.log(queryParams);

	const queryParamsArray = [];
	for (const [k, v] of Object.entries(queryParams)) {
		queryParamsArray.push(`${k}=${v}`);
	}
	return (
		'https://pubads.g.doubleclick.net/gampad/live/ads?' +
		queryParamsArray.join('&')
	);
};

export { buildAdsConfigWithConsent, buildImaAdTagUrl, disabledAds };

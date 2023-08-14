import type { Participations } from '@guardian/ab-core';
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
	clientSideParticipations: Participations,
): AdsConfig => {
	const mergedCustomParams = {
		...customParams,
		...buildPageTargeting({
			adFree: false,
			clientSideParticipations,
			consentState: cmpConsent,
			youtube: true,
		}),
		// 19/04/2023 This is a temporary update to assist reporting for a YouTube IMA test
		yt_embed_ima: '0',
	};

	const defaultAdsConfig: AdsConfigBasic = {
		adTagParameters: {
			iu: adUnit,
			// TODO: Why are we double encoding? Following Frontend process for now
			cust_params: encodeURIComponent(constructQuery(mergedCustomParams)),
		},
	};

	if (cmpConsent.framework === 'ccpa' || cmpConsent.framework === 'aus') {
		return {
			...defaultAdsConfig,
			restrictedDataProcessor: !cmpConsent.canTarget,
		} satisfies AdsConfigCCPAorAus;
	}

	if (cmpConsent.framework === 'tcfv2') {
		const tcfData = cmpConsent.tcfv2;
		if (tcfData) {
			const mergedAdTagParameters = {
				...defaultAdsConfig.adTagParameters,
				cmpGdpr: tcfData.gdprApplies ? 1 : 0,
				cmpGvcd: tcfData.addtlConsent,
				cmpVcd: tcfData.tcString,
			};
			return {
				adTagParameters: mergedAdTagParameters,
				nonPersonalizedAd: !cmpConsent.canTarget,
			} satisfies AdsConfigTCFV2;
		}
	}

	// Shouldn't happen but handle if no matching framework
	return disabledAds;
};

type BuildAdsConfigWithConsent = {
	isAdFreeUser: boolean;
	adUnit: string;
	customParams: CustomParams;
	consentState: ConsentState;
	clientSideParticipations: Participations;
};

const buildAdsConfigWithConsent = ({
	adUnit,
	clientSideParticipations,
	consentState,
	customParams,
	isAdFreeUser,
}: BuildAdsConfigWithConsent): AdsConfig => {
	if (isAdFreeUser) {
		return disabledAds;
	}
	return buildAdsConfig(
		consentState,
		adUnit,
		customParams,
		clientSideParticipations,
	);
};

export { buildAdsConfigWithConsent, disabledAds };

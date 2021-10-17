export type TagAtrribute = {
	name: string;
	value: string;
};

export type GetThirdPartyTag = (arg0: { shouldRun: boolean }) => ThirdPartyTag;

export type ThirdPartyTag = {
	async?: boolean;
	attrs?: TagAtrribute[];
	beforeLoad?: () => void;
	insertSnippet?: () => void;
	loaded?: boolean;
	onLoad?: () => void;
	shouldRun: boolean;
	name?: string;
	url?: string;
	useImage?: boolean;
};

export type GuardianAnalyticsConfig = {
	trackers: Record<string, string>;
};

export type GuardianWindowConfig = {
	googleAnalytics?: GuardianAnalyticsConfig;
};

export type GoogleTagParams = unknown;
export type GoogleTrackConversionObject = {
	google_conversion_id: number;
	google_custom_params: GoogleTagParams;
	google_remarketing_only: boolean;
};

export type MaybeArray<T> = T | T[];

export type CustomParams = Record<
	string,
	MaybeArray<string | number | boolean>
>;

export interface AdsConfigDisabled {
	disableAds: true;
}

export interface AdsConfigBasic {
	adTagParameters: {
		iu: string;
		cust_params: string;
	};
}

export type AdsConfigCCPAorAus = AdsConfigBasic & {
	restrictedDataProcessor: boolean;
};

export type AdsConfigTCFV2 = AdsConfigBasic & {
	adTagParameters: {
		cmpGdpr: number;
		cmpVcd: string;
		cmpGvcd: string;
	};
	nonPersonalizedAd: boolean;
};

export type AdsConfigEnabled =
	| AdsConfigBasic
	| AdsConfigCCPAorAus
	| AdsConfigTCFV2;

export type AdsConfig = AdsConfigEnabled | AdsConfigDisabled;

export type AdTargetingBuilder = () => Promise<AdsConfig>;

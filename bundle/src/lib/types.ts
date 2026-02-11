import type { VendorName } from '@guardian/libs';

export type TagAttribute = {
	name: string;
	value: string;
};

export type ThirdPartyTag = {
	async?: boolean;
	attrs?: TagAttribute[];
	beforeLoad?: () => void;
	insertSnippet?: () => void;
	loaded?: boolean;
	onLoad?: () => void;
	shouldRun: boolean;
	name?: VendorName;
	url?: string;
	useImage?: boolean;
};

export type GetThirdPartyTag = (arg0: { shouldRun: boolean }) => ThirdPartyTag;

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

export type AdsConfigDisabled = {
	disableAds: true;
};

export type AdsConfigBasic = {
	adTagParameters: {
		iu: string;
		cust_params: string;
	};
};

export type AdsConfigUSNATorAus = AdsConfigBasic & {
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

export type True = 't';

export type False = 'f';

export type NotApplicable = 'na';

export const isDefined = <T>(x: T | undefined): x is T => x !== undefined;

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

export type Edition = 'UK' | 'AU' | 'US';

export type GuardianWindowConfig = {
	commercialMetricsInitialised: boolean;
	isDotcomRendering: boolean;
	ophan: {
		// somewhat redundant with guardian.ophan
		browserId?: string;
		pageViewId: string;
	};
	page: {
		dcrCouldRender: boolean;
		edition: Edition;
		isPreview: boolean;
		isSensitive: boolean;
		pageId: string;
		section: string;
		sharedAdTargeting?: Record<string, string | string[]>;
		videoDuration: number;
		webPublicationDate: number;
	};
	tests?: {
		[key: `${string}Control`]: 'control';
		[key: `${string}Variant`]: 'variant';
	};
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

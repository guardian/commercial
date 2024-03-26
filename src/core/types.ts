import type { VendorName } from '@guardian/libs';

export type ConnectionType =
	| 'bluetooth'
	| 'cellular'
	| 'ethernet'
	| 'mixed'
	| 'none'
	| 'other'
	| 'unknown'
	| 'wifi';

export interface NetworkInformation extends EventTarget {
	readonly type?: ConnectionType;
	readonly downlink?: number;
	readonly effectiveType?: string;
}

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

export type GuardianAnalyticsConfig = {
	trackers: Record<string, string>;
};

export type Edition = 'UK' | 'AU' | 'US';

export type GuardianWindowConfig = {
	googleAnalytics?: GuardianAnalyticsConfig;
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

export type True = 't';

export type False = 'f';

export type NotApplicable = 'na';

/**
 * Generates a type which represents possible indices of this array
 *
 * Example usage:
 * const list = ['foo', 'bar', 'baz'] as const;
 * type Test = Indices<typeof list>
 */
export type Indices<T extends readonly unknown[]> = Exclude<
	Partial<T>['length'],
	T['length']
>;

export const isDefined = <T>(x: T | undefined): x is T => x !== undefined;

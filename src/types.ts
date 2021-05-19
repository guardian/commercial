import type { EventTimer } from './EventTimer';

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

declare global {
	interface Navigator {
		connection?: {
			downlink: number;
			effectiveType: string;
		};
	}
	interface Window {
		google_trackConversion?: (arg0: GoogleTrackConversionObject) => void;
		google_tag_params?: GoogleTagParams;
		_brandmetrics?: Array<{
			cmd: string;
			val: Record<string, unknown>;
		}>;
		googletag?: googletag.Googletag;
		guardian: {
			commercialTimer?: EventTimer;
			config?: GuardianWindowConfig;
		};
		ga: UniversalAnalytics.ga;
		readonly navigator: Navigator;
	}
}

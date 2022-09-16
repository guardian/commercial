import type {
	GoogleTagParams,
	GoogleTrackConversionObject,
	GuardianWindowConfig,
} from './types';
import type { EventTimer } from '.';

declare global {
	/**
	 * lib.dom.d.ts only includes features that are supported in at least two main browsers.
	 * NetworkInformation is supported in Chrome only – it's behind a flag in Firefox.
	 * If or when the NetworkInformation API is more widely supported, we can remove this shim.
	 * https://github.com/mdn/browser-compat-data/blob/main/api/NetworkInformation.json
	 */
	type ConnectionType =
		| 'bluetooth'
		| 'cellular'
		| 'ethernet'
		| 'mixed'
		| 'none'
		| 'other'
		| 'unknown'
		| 'wifi';
	interface NetworkInformation extends EventTarget {
		readonly type: ConnectionType;
		readonly downlink?: number;
		readonly effectiveType?: string;
	}
	interface Navigator {
		connection: NetworkInformation;
	}
	interface Window {
		google_trackConversion?: (arg0: GoogleTrackConversionObject) => void;
		google_tag_params?: GoogleTagParams;
		_brandmetrics?: Array<{
			cmd: string;
			val: Record<string, unknown>;
		}>;
		guardian: {
			commercialTimer?: EventTimer;
			config?: GuardianWindowConfig;
		};
		ga: UniversalAnalytics.ga | null;
		readonly navigator: Navigator;
	}
}

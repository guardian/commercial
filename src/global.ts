import type {
	GoogleTagParams,
	GoogleTrackConversionObject,
	GuardianWindowConfig,
} from './types';
import type { EventTimer } from '.';

declare global {
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
		readonly type?: ConnectionType;
		readonly downlink?: number;
		readonly effectiveType?: string;
	}

	interface Navigator {
		readonly connection: NetworkInformation;
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
			config: GuardianWindowConfig;
		};
		ga: UniversalAnalytics.ga | null;
		readonly navigator: Navigator;
	}
}

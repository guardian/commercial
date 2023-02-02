import type {
	GoogleTagParams,
	GoogleTrackConversionObject,
	GuardianWindowConfig,
	NetworkInformation,
} from './types';
import type { EventTimer } from '.';

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
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
		offlineCount?: number;
	}
}

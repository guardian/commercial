import type { EventTimer } from './event-timer';
import type {
	AdBlockers,
	Apstag,
	ArticleCounts,
	ComscoreGlobals,
	Confiant,
	Config,
	DfpEnv,
	FetchBidResponse,
	GoogleTagParams,
	GoogleTrackConversionObject,
	HeaderNotification,
	IasPET,
	NetworkInformation,
	NSdkInstance,
	Ophan,
	OptOutAdSlot,
	OptOutInitializeOptions,
	Permutive,
	SafeFrameAPI,
	TeadsAnalytics,
	Trac,
} from './types';

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
		readonly cookieDeprecationLabel?: {
			getValue: () => Promise<string>;
		};
	}

	interface Window {
		guardian: {
			ophan?: Ophan;
			config: Config;
			queue: Array<() => Promise<void>>;
			mustardCut?: boolean;
			polyfilled?: boolean;
			adBlockers: AdBlockers;
			css: { onLoad: () => void; loaded: boolean };
			articleCounts?: ArticleCounts;
			commercial?: {
				dfpEnv?: DfpEnv;
				a9WinningBids?: FetchBidResponse[];
			};
			notificationEventHistory?: HeaderNotification[][];
			commercialTimer?: EventTimer;
			offlineCount?: number;
			modules: {
				sentry?: {
					reportError?: (
						error: Error,
						feature: string,
						tags?: Record<string, string>,
						extras?: Record<string, unknown>,
					) => void;
				};
			};
		};

		ootag: {
			queue: Array<() => void>;
			initializeOo: (o: OptOutInitializeOptions) => void;
			addParameter: (key: string, value: string | string[]) => void;
			addParameterForSlot: (
				slotId: string,
				key: string,
				value: string | string[],
			) => void;
			defineSlot: (o: OptOutAdSlot) => void;
			makeRequests: () => void;
			refreshSlot: (slotId: string) => void;
			refreshAllSlots: () => void;
			logger: (...args: unknown[]) => void;
		};

		readonly navigator: Navigator;

		confiant?: Confiant;

		apstag?: Apstag;

		permutive?: Permutive;

		_comscore?: ComscoreGlobals[];

		__iasPET?: IasPET;

		teads_analytics?: TeadsAnalytics;

		// https://www.iab.com/wp-content/uploads/2014/08/SafeFrames_v1.1_final.pdf
		$sf: SafeFrameAPI;
		// Safeframe API host config required by Opt Out tag
		conf: unknown;

		// IMR Worldwide
		NOLCMB: {
			getInstance: (apid: string) => NSdkInstance;
		};
		nol_t: (pvar: { cid: string; content: string; server: string }) => Trac;

		// Google
		google_trackConversion?: (arg0: GoogleTrackConversionObject) => void;
		google_tag_params?: GoogleTagParams;

		// Brand metrics
		_brandmetrics?: Array<{
			cmd: string;
			val: Record<string, unknown>;
		}>;

		// Admiral ad blocker detection
		admiral?: () => void;
	}
}

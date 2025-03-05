import type { CustomClaims } from '@guardian/identity-auth';
import type { VendorName } from '@guardian/libs';
import type { DfpEnv } from '../lib/dfp/dfp-env';
import type { EventTimer } from '../lib/event-timer';
import type { PageTargeting } from '../lib/targeting/build-page-targeting';
import type {
	GoogleTagParams,
	GoogleTrackConversionObject,
	NetworkInformation,
} from '../lib/types';
import type { IasPETSlot } from './ias';

type ServerSideABTest = `${string}${'Variant' | 'Control'}`;

type TagAttribute = {
	name: string;
	value: string;
};

type ThirdPartyTag = {
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

// This comes from Scala:
// https://github.com/guardian/frontend/blob/main/common/app/common/commercial/PrebidIndexSite.scala#L10
// https://github.com/guardian/frontend/blob/main/common/app/views/support/JavaScriptPage.scala#L54
type PrebidBreakpoint = 'D' | 'T' | 'M';
type PrebidIndexSite = {
	bp: PrebidBreakpoint;
	id: number;
};

// This comes from Scala:
// https://github.com/guardian/frontend/blob/main/common/app/model/meta.scala#L349
type AdUnit = string;

interface CommercialPageConfig {
	pbIndexSites: PrebidIndexSite[];
	adUnit: AdUnit;
	appNexusPageTargeting?: string;
	sharedAdTargeting?: Record<string, string | string[]>;
	shouldHideAdverts: boolean;
	pageAdTargeting?: PageTargeting;
	dfpAccountId: string;
	ipsosTag?: string;
	a9PublisherId: string;
	libs?: {
		googletag?: string;
	};
}

interface UserConfig {
	accountCreatedDate: number;
	displayName: string;
	emailVerified: boolean;
	id: string;
	rawResponse: string;
}

type BoostGaUserTimingFidelityMetrics = {
	standardStart: 'metric18';
	standardEnd: 'metric19';
	commercialStart: 'metric20';
	commercialEnd: 'metric21';
	enhancedStart: 'metric22';
	enhancedEnd: 'metric23';
};

type GoogleTimingEvent = {
	timingCategory: string;
	timingVar: keyof BoostGaUserTimingFidelityMetrics;
	timeSincePageLoad: number;
	timingLabel: string;
};

type Edition = 'UK' | 'AU' | 'US'; // https://github.com/guardian/frontend/blob/b952f6b9/common/app/views/support/JavaScriptPage.scala#L79

interface LightboxImages {
	images: Array<{ src: string }>;
}

type Stage = 'DEV' | 'CODE' | 'PROD';

interface PageConfig extends CommercialPageConfig {
	ajaxUrl?: string; // https://github.com/guardian/frontend/blob/33db7bbd/common/app/views/support/JavaScriptPage.scala#L72
	assetsPath: string;
	author: string;
	authorIds: string;
	blogIds: string;
	commentable: boolean;
	contentType: string;
	dcrCouldRender: boolean;
	edition: Edition;
	frontendAssetsFullURL?: string; // only in DCR
	hasPageSkin: boolean; // https://github.com/guardian/frontend/blob/b952f6b9/common/app/views/support/JavaScriptPage.scala#L48
	hasShowcaseMainElement: boolean;
	hasYouTubeAtom: boolean;
	headline: string;
	host: string;
	idApiUrl?: string;
	idUrl?: string;
	isbn?: string;
	isDev: boolean; // https://github.com/guardian/frontend/blob/33db7bbd/common/app/views/support/JavaScriptPage.scala#L73
	isFront: boolean; // https://github.com/guardian/frontend/blob/201cc764/common/app/model/meta.scala#L352
	isHosted: boolean; // https://github.com/guardian/frontend/blob/66afe02e/common/app/common/commercial/hosted/HostedMetadata.scala#L37
	isImmersive?: boolean;
	isLiveBlog?: boolean;
	isPaidContent: boolean;
	isPreview: boolean;
	isProd: boolean; // https://github.com/guardian/frontend/blob/33db7bbd/common/app/views/support/JavaScriptPage.scala
	isSensitive: boolean;
	isMinuteArticle: boolean;
	keywordIds: string;
	keywords: string;
	lightboxImages?: LightboxImages;
	pageId: string;
	publication: string;
	revisionNumber: string; // https://github.com/guardian/frontend/blob/1b6f41c3/common/app/model/meta.scala#L388
	section: string;
	sectionName: string;
	sentryHost: string;
	sentryPublicApiKey: string;
	series: string;
	seriesId: string;
	sharedAdTargeting?: Record<string, string | string[]>;
	shouldHideReaderRevenue?: boolean;
	showNewRecipeDesign?: boolean;
	showRelatedContent?: boolean;
	source: string;
	sponsorshipType: string;
	toneIds: string;
	tones: string;
	videoDuration: number;
	webPublicationDate: number;
	userAttributesApiUrl?: string;
}

interface Config {
	commercialMetricsInitialised?: boolean;
	frontendAssetsFullURL?: string;
	isDotcomRendering: boolean;
	ophan: {
		// somewhat redundant with guardian.ophan
		browserId?: string;
		pageViewId: string;
	};
	page: PageConfig;
	shouldSendCommercialMetrics?: boolean;
	stage: Stage;
	switches: Record<string, boolean | undefined>;
	tests?: {
		[key: `${string}Control`]: 'control';
		[key: `${string}Variant`]: 'variant';
	};
	user?: UserConfig;
}

type OphanRecordFunction = (
	event: Record<string, unknown> & {
		/**
		 * the experiences key will override previously set values.
		 * Use `recordExperiences` instead.
		 */
		experiences?: never;
	},
	callback?: () => void,
) => void;
interface Ophan {
	trackComponentAttention: (
		name: string,
		el: Element,
		visiblityThreshold: number,
	) => void;
	record: OphanRecordFunction;
	viewId: string;
	pageViewId: string;
}

interface ImpressionsDfpObject {
	s: string; // Slot element ID
	ad: string; // Advertiser ID
	c: string; // Creative ID
	I: string; // Line item ID
	o: string; // Order ID
	A: string; // Ad unit name
	y: string; // Yield group ID (Exchange Bidder)
	co: string; // DFP Company ID (Exchange Bidder)
}

enum BlockingType {
	Manual = 1, // Deprecated
	Creative, // Creative-based detection
	ProviderSecurity, // Domain-based detection for unsafe domains
	BannedDomain, // Domain-based detection for banned domains
	ProviderIbv, // Domain-based detection for in-banner-video
	UnsafeJS, // JavaScript-based detection for unsafe ads
	Hrap, // Domain-based detection for high risk ad platform domains
}

type ConfiantCallback = (
	blockingType: BlockingType,
	blockingId: string,
	isBlocked: boolean,
	wrapperId: string,
	tagId: string,
	impressionsData?: {
		prebid?: {
			adId?: string | null;
			cpm?: number | null; // IN USD
			s?: string; // slot ID
		};
		dfp?: ImpressionsDfpObject;
	},
) => void;

interface Confiant extends Record<string, unknown> {
	settings: {
		callback: ConfiantCallback;
		[key: string]: unknown;
	};
}

interface Permutive {
	config?: {
		projectId?: string;
		apiKey?: string;
		environment?: string;
	};
	q?: Array<{ functionName: string; arguments: unknown[] }>;
	addon?: (name: string, props: Record<string, unknown>) => void;
	identify?: (user: Array<{ id: string; tag: string }>) => void;
}

// https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/api-reference.html#apstaginit
interface A9AdUnitInterface {
	slotID: string;
	slotName?: string;
	sizes: number[][];
}

type ApstagInitConfig = {
	pubID: string;
	adServer?: string;
	bidTimeout?: number;
	blockedBidders?: string[];
};

type FetchBidsBidConfig = {
	slots: A9AdUnitInterface[];
};

type Apstag = {
	init: (arg0: ApstagInitConfig) => void;
	fetchBids: (arg0: FetchBidsBidConfig, callback: () => void) => void;
	setDisplayBids: () => void;
};

type ComscoreGlobals = {
	c1: string;
	c2: string;
	cs_ucfr: string;
	comscorekw?: string;
	options?: {
		enableFirstPartyCookie?: boolean;
	};
};

type CustomIdTokenClaims = CustomClaims & {
	email: string;
	google_tag_id: string;
};

type AdBlockers = {
	active: boolean | undefined;
	onDetect: Array<(value: boolean | PromiseLike<boolean>) => void>;
};

/**
 *  All article history types here are duplicated from elsewhere.
 *  This is because adding imports to this file causes typechecking to break for every use of window.guardian in the codebase.
 */
type TagCounts = Record<string, number>;
type WeeklyArticleLog = {
	week: number;
	count: number;
	tags?: TagCounts;
};
type WeeklyArticleHistory = WeeklyArticleLog[];

interface DailyArticleCount {
	day: number;
	count: number;
}

type DailyArticleHistory = DailyArticleCount[];

interface ArticleCounts {
	weeklyArticleHistory: WeeklyArticleHistory;
	dailyArticleHistory: DailyArticleHistory;
}

interface IasPET {
	queue?: Array<{
		adSlots: IasPETSlot[];
		dataHandler: (targetingJSON: string) => void;
	}>;
	pubId?: string;
}

interface TeadsAnalytics {
	analytics_tag_id?: string;
	share?: () => void;
	shared_data?: unknown[];
}

interface OptOutInitializeOptions {
	publisher: number;
	onlyNoConsent?: 0 | 1;
	alwaysNoConsent?: 0 | 1;
	consentTimeOutMS?: 5000;
	noLogging?: 0 | 1;
	lazyLoading?: { fractionInView?: number; viewPortMargin?: string };
	noRequestsOnPageLoad?: 0 | 1;
	frequencyScript?: string;
	timeoutFrequencyCappingMS?: number;
	debug_forceCap?: number;
}

interface OptOutResponse {
	adSlot: string;
	width: number;
	height: number;
	ad: string; // The creative HTML
	creativeId: string;
	meta: {
		networkId: string;
		networkName: string;
		agencyId: string;
		agencyName: string;
		advertiserId: string;
		advertiserName: string;
		advertiserDomains: string[];
	};
	optOutExt: {
		noSafeFrame: boolean;
		tags: string[];
	};
}

interface OptOutAdSlot {
	adSlot: string;
	targetId: string;
	id: string;
	// eslint-disable-next-line no-use-before-define -- circular reference
	filledCallback?: OptOutFilledCallback;
	emptyCallback?: (adSlot: OptOutAdSlot) => void;
	adShownCallback?: (adSlot: OptOutAdSlot, response: OptOutResponse) => void;
}

type OptOutFilledCallback = (
	adSlot: OptOutAdSlot,
	response: OptOutResponse,
) => void;

/**
 * Describes the configuration options for the Safeframe host API
 *
 * Currently typed as `unknown` since we do not consume it ourselves
 */
type SafeFrameAPIHostConfig = unknown;

/**
 * Types for the IAB Safeframe API
 *
 * Note this type definition is incomplete.
 * These types can be refined as/when they are required
 */
interface SafeFrameAPI {
	ver: string;
	specVersion: string;
	lib: {
		lang: Record<string, unknown>;
		dom: {
			iframes: Record<string, unknown>;
			msghost: Record<string, unknown>;
		};
		logger: Record<string, unknown>;
	};
	env: {
		isIE: boolean;
		ua: Record<string, unknown>;
	};
	info: {
		errs: unknown[];
		list: unknown[];
	};
	host: {
		Config: {
			new (o: {
				renderFile: string;
				positions: Record<string, unknown>;
			}): SafeFrameAPIHostConfig;
		};
	};
}

/**
 * Types for IMR Worldwide
 */
interface NSdkInstance {
	ggPM: (
		type: string,
		dcrStaticMetadata: {
			type: string;
			assetid: unknown;
			section: string;
		},
	) => void;
	ggInitialize: (nolggGlobalParams: {
		sfcode: string;
		apid: string;
		apn: string;
	}) => void;
}

interface Trac {
	record: () => this;
	post: () => this;
}

interface HeaderNotification {
	id: string;
	target: string;
	message: string;
	ophanLabel: string;
	logImpression: () => void;
}

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
		readonly cookieDeprecationLabel?: {
			getValue: () => Promise<string>;
		};
	}
	interface Window {
		guardian: {
			ophan: Ophan;
			config: Config;
			queue: Array<() => Promise<void>>;
			mustardCut?: boolean;
			polyfilled?: boolean;
			adBlockers: AdBlockers;
			// /frontend/common/app/templates/inlineJS/blocking/enableStylesheets.scala.js
			css: { onLoad: () => void; loaded: boolean };
			articleCounts?: ArticleCounts;
			commercial?: {
				dfpEnv?: DfpEnv;
			};
			notificationEventHistory?: HeaderNotification[][];
			commercialTimer?: EventTimer;
			offlineCount?: number;
			modules: {
				sentry?: {
					reportError?: (
						error: unknown,
						feature: string,
						tags?: Record<string, string>,
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

		// Third parties

		confiant?: Confiant;

		apstag?: Apstag;

		permutive?: Permutive;

		_comscore?: ComscoreGlobals[];

		__iasPET?: IasPET;

		teads_analytics?: TeadsAnalytics;

		// https://www.iab.com/wp-content/uploads/2014/08/SafeFrames_v1.1_final.pdf
		$sf: SafeFrameAPI;
		// Safeframe API host config required by Opt Out tag
		conf: SafeFrameAPIHostConfig;

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
	}
}

export type {
	A9AdUnitInterface,
	BoostGaUserTimingFidelityMetrics,
	ConfiantCallback,
	ComscoreGlobals,
	Config,
	Edition,
	GoogleTimingEvent,
	Ophan,
	OptOutFilledCallback,
	PageConfig,
	Permutive,
	PrebidIndexSite,
	UserConfig,
	ServerSideABTest,
	Stage,
	TagAttribute,
	ThirdPartyTag,
	CustomIdTokenClaims,
};

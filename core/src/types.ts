import type { EventPayload } from '@guardian/ophan-tracker-js';
import type { AdSize, SizeMapping } from './ad-sizes';
import type { PageTargeting } from './targeting/build-page-targeting';
import '@types/google-publisher-tag';

type HeaderBiddingSize = AdSize;

type AdvertStatus =
	| 'ready'
	| 'preparing'
	| 'prepared'
	| 'fetching'
	| 'fetched'
	| 'loading'
	| 'loaded'
	| 'rendered';

interface Advert extends EventTarget {
	id: string;
	node: HTMLElement;
	sizes: SizeMapping;
	headerBiddingSizes: HeaderBiddingSize[] | null;
	size: AdSize | 'fluid' | null;
	slot: googletag.Slot;
	status: AdvertStatus;
	gpid: string | undefined;
	isEmpty: boolean | null;
	isRendered: boolean;
	shouldRefresh: boolean;
	whenSlotReady: Promise<void>;
	extraNodeClasses: string[];
	hasPrebidSize: boolean;
	headerBiddingBidRequest: Promise<unknown> | null;
	lineItemId: number | null;
	creativeId: number | null;
	creativeTemplateId: number | null;
	testgroup: string | undefined;

	on(
		status: AdvertStatus | AdvertStatus[],
		callback: (status: AdvertStatus | AdvertStatus[]) => void,
	): void;
	once(status: AdvertStatus, callback: () => void): void;

	finishedRendering(isRendered: boolean): void;

	updateExtraSlotClasses(...newClasses: string[]): Promise<void>;
	generateSizeMapping(additionalSizeMapping: SizeMapping): SizeMapping;
	updateSizeMapping(additionalSizeMapping: SizeMapping): void;
}

interface DfpEnv {
	renderStartTime: number;
	adSlotSelector: string;
	lazyLoadEnabled: boolean;
	lazyLoadObserve: boolean;
	advertsToLoad: Advert[];
	adverts: Map<Advert['id'], Advert>;
	shouldLazyLoad: () => boolean;
}

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

type OphanRecordFunction = (
	event: EventPayload & {
		/**
		 * the experiences key will override previously set values.
		 * Use `recordExperiences` instead.
		 */
		experiences?: never;
	},
	callback?: () => void,
) => void;

/**
 * Generates a type which represents possible indices of this array
 *
 * Example usage:
 * const list = ['foo', 'bar', 'baz'] as const;
 * type Test = Indices<typeof list>
 */
type Indices<T extends readonly unknown[]> = Exclude<
	Partial<T>['length'],
	T['length']
>;

type Edition = 'UK' | 'AU' | 'US'; // https://github.com/guardian/frontend/blob/b952f6b9/common/app/views/support/JavaScriptPage.scala#L79

type AdsConfigDisabled = {
	disableAds: true;
};

type AdsConfigBasic = {
	adTagParameters: {
		iu: string;
		cust_params: string;
	};
};

type AdsConfigUSNATorAus = AdsConfigBasic & {
	restrictedDataProcessor: boolean;
};

type AdsConfigTCFV2 = AdsConfigBasic & {
	adTagParameters: {
		cmpGdpr: number;
		cmpVcd: string;
		cmpGvcd: string;
	};
	nonPersonalizedAd: boolean;
};

type AdsConfigEnabled = AdsConfigBasic | AdsConfigUSNATorAus | AdsConfigTCFV2;

type AdsConfig = AdsConfigEnabled | AdsConfigDisabled;

type AdTargetingBuilder = () => Promise<AdsConfig>;

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

type PrebidBreakpoint = 'D' | 'T' | 'M';
type PrebidIndexSite = {
	bp: PrebidBreakpoint;
	id: number;
};

interface CommercialPageConfig {
	pbIndexSites: PrebidIndexSite[];
	adUnit: string;
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
	lightboxImages?: {
		images: Array<{ src: string }>;
	};
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

type Stage = 'DEV' | 'CODE' | 'PROD';

interface UserConfig {
	accountCreatedDate: number;
	displayName: string;
	emailVerified: boolean;
	id: string;
	rawResponse: string;
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

type AdBlockers = {
	active: boolean | undefined;
	onDetect: Array<(value: boolean | PromiseLike<boolean>) => void>;
};

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

type FetchBidSizes = {
	adSizes: `${number}x${number}`;
};
type FetchBidResponse = {
	amznbid: string;
	amzniid: string;
	amznp: string;
	amznsz: FetchBidSizes;
	size: FetchBidSizes;
	slotID: string;
};

interface HeaderNotification {
	id: string;
	target: string;
	message: string;
	ophanLabel: string;
	logImpression: () => void;
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

type OptOutFilledCallback = (
	adSlot: OptOutAdSlot,
	response: OptOutResponse,
) => void;

interface OptOutAdSlot {
	adSlot: string;
	targetId: string;
	id: string;
	filledCallback?: OptOutFilledCallback;
	emptyCallback?: (adSlot: OptOutAdSlot) => void;
	adShownCallback?: (adSlot: OptOutAdSlot, response: OptOutResponse) => void;
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
	track?: (name: string, props: Record<string, unknown>) => void;
}

type ApstagInitConfig = {
	pubID: string;
	adServer?: string;
	bidTimeout?: number;
	blockedBidders?: string[];
	useSafeFrames?: boolean;
};

// https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/api-reference.html#apstaginit
interface A9AdUnitInterface {
	slotID: string;
	slotName?: string;
	sizes: number[][];
}

type FetchBidsBidConfig = {
	slots: A9AdUnitInterface[];
};

type Apstag = {
	init: (arg0: ApstagInitConfig) => void;
	fetchBids: (
		arg0: FetchBidsBidConfig,
		callback: (res: FetchBidResponse[]) => void,
	) => void;
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

interface IasPETSlot {
	adSlotId: string;
	size: Array<[number, number]>;
	adUnitPath: string;
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
			}): unknown;
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

type GoogleTagParams = unknown;
type GoogleTrackConversionObject = {
	google_conversion_id: number;
	google_custom_params: GoogleTagParams;
	google_remarketing_only: boolean;
};

type AdmiralEvent = Record<string, unknown>;
type AdmiralCallback = (event: AdmiralEvent) => void;
type AdmiralArg = string | AdmiralCallback;
type Admiral = (...args: AdmiralArg[]) => void;

export type {
	Advert,
	AdvertStatus,
	DfpEnv,
	ConnectionType,
	NetworkInformation,
	OphanRecordFunction,
	Indices,
	Edition,
	AdsConfigDisabled,
	AdsConfigEnabled,
	AdsConfigBasic,
	AdsConfigUSNATorAus,
	AdsConfigTCFV2,
	AdsConfig,
	AdTargetingBuilder,
	Ophan,
	Config,
	AdBlockers,
	ArticleCounts,
	FetchBidResponse,
	HeaderNotification,
	OptOutInitializeOptions,
	OptOutAdSlot,
	Confiant,
	Permutive,
	Apstag,
	ComscoreGlobals,
	IasPET,
	TeadsAnalytics,
	SafeFrameAPI,
	NSdkInstance,
	Trac,
	GoogleTagParams,
	GoogleTrackConversionObject,
	Admiral,
	AdmiralEvent,
};

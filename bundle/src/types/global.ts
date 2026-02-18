import type { PageTargeting } from '@guardian/commercial-core/targeting/build-page-targeting';
import type {
	AdBlockers,
	Apstag,
	ArticleCounts,
	Confiant,
	CoreGuardian,
	GoogleTagParams,
	GoogleTrackConversionObject,
	HeaderNotification,
	IasPET,
	NSdkInstance,
	OphanRecordFunction,
	OptOutInitializeOptions,
	SafeFrameAPI,
	TeadsAnalytics,
	Trac,
} from '@guardian/commercial-core/types';
import type { CustomClaims } from '@guardian/identity-auth';
import type { Advert } from '../define/Advert';
import type { Queue } from '../lib/guardian-commercial-queue';
import type { ThirdPartyTag } from '../lib/types';

type ServerSideABTest = `${string}${'Variant' | 'Control'}`;

type TagAttribute = {
	name: string;
	value: string;
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

// https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/api-reference.html#apstaginit
interface A9AdUnitInterface {
	slotID: string;
	slotName?: string;
	sizes: number[][];
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
	filledCallback?: OptOutFilledCallback;
	emptyCallback?: (adSlot: OptOutAdSlot) => void;
	adShownCallback?: (adSlot: OptOutAdSlot, response: OptOutResponse) => void;
}

type OptOutFilledCallback = (
	adSlot: OptOutAdSlot,
	response: OptOutResponse,
) => void;

interface DfpEnv {
	renderStartTime: number;
	adSlotSelector: string;
	lazyLoadEnabled: boolean;
	lazyLoadObserve: boolean;
	advertsToLoad: Advert[];
	adverts: Map<Advert['id'], Advert>;
	shouldLazyLoad: () => boolean;
}

interface Guardian extends CoreGuardian {
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
		queue?: Queue;
	};
	notificationEventHistory?: HeaderNotification[][];
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
}

declare global {
	interface Navigator {
		readonly cookieDeprecationLabel?: {
			getValue: () => Promise<string>;
		};
	}

	interface Window {
		guardian: Guardian;

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
	}
}

export type {
	A9AdUnitInterface,
	BoostGaUserTimingFidelityMetrics,
	ConfiantCallback,
	ComscoreGlobals,
	DfpEnv,
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
	FetchBidResponse,
};

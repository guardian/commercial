interface AnalyticsAdapterConfig {
	analyticsType: string;
}

interface BidArgs {
	bidderCode?: string;
	adserverTargeting?: Record<string, string>;
	adId?: string;
	requestId?: string;
	auctionId?: string;
	bidder?: string;
	bidId?: string;
	bids?: Array<{
		adUnitCode?: string;
		bidId?: string;
	}>;
	adUnitCode?: string;
	cpm?: number;
	pbCg?: number;
	currency?: string;
	netRevenue?: boolean;
	creativeId?: string;
	size?: string;
	timeToRespond?: number;
	dealId?: string;
	statusMessage?: string;
	start?: number;
	meta?: {
		networkId?: string;
		buyerId?: string;
		brandId?: string;
		brandName?: string;
		clickUrl?: string;
	};
}

type TrackParams = {
	eventType: string;
	args: BidArgs;
};

const eventKeys = [
	'ev',
	'aid',
	'bid',
	'st',
	'n',
	'sid',
	'cpm',
	'pb',
	'cry',
	'net',
	'did',
	'cid',
	'sz',
	'ttr',
	'lid',
	'dsp',
	'adv',
	'bri',
	'brn',
	'add',
] as const;

type EventData = Partial<
	Record<(typeof eventKeys)[number], string | number | boolean>
>;

type RawEventData = Partial<
	Record<
		(typeof eventKeys)[number],
		string | number | boolean | undefined | null
	>
>;

interface AnalyticsAdapterContext {
	url: string;
	pv: string;
	auctionTimeStart?: number;
}

interface AnalyticsOptions {
	url: string;
	pv: string;
}

interface AnalyticsAdapter {
	track: (params: TrackParams) => void;
	enableAnalytics: (config: { options: AnalyticsOptions }) => void;
	originEnableAnalytics?: (config: { options: AnalyticsOptions }) => void;
	context?: AnalyticsAdapterContext;
	ajaxCall: (data: string) => void;
}

interface AnalyticsConfig {
	options: AnalyticsOptions;
}

type Handler = (adapter: AnalyticsAdapter, args: BidArgs) => EventData[] | null;

export { eventKeys };

export type {
	BidArgs,
	EventData,
	RawEventData,
	AnalyticsOptions,
	AnalyticsConfig,
	AnalyticsAdapter,
	AnalyticsAdapterConfig,
	Handler,
};

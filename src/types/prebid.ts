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

interface EventData {
	ev: string;
	aid?: string;
	bid?: string;
	st?: number;
	n?: string;
	sid?: string;
	cpm?: number;
	pb?: number;
	cry?: string;
	net?: boolean;
	did?: string;
	cid?: string;
	sz?: string;
	ttr?: number;
	lid?: string;
	dsp?: string;
	adv?: string;
	bri?: string;
	brn?: string;
	add?: string;
	[key: string]: unknown;
}

interface AnalyticsAdapterContext {
	ajaxUrl?: string;
	pv?: string;
	auctionTimeStart?: number;
	requestTemplate?: Record<string, unknown>;
	queue?: {
		init: () => void;
		push: (events: EventData[]) => void;
		popAll: () => EventData[];
		peekAll: () => EventData[];
	};
	[key: string]: unknown;
}

interface AnalyticsOptions {
	ajaxUrl?: string;
	pv?: string;
	[key: string]: unknown;
}

interface AnalyticsAdapter {
	track: (params: TrackParams) => void;
	enableAnalytics: (config: { options: AnalyticsOptions }) => void;
	originEnableAnalytics?: (config: { options: AnalyticsOptions }) => void;
	context?: AnalyticsAdapterContext;
	ajaxCall: (data: string) => void;
}

interface RequestTemplate {
	v: number;
	pv: string;
	[key: string]: unknown;
}

interface AnalyticsConfig {
	options: AnalyticsOptions;
}

type Handler = (adapter: AnalyticsAdapter, args: BidArgs) => EventData[] | null;

export type {
	BidArgs,
	EventData,
	RequestTemplate,
	AnalyticsOptions,
	AnalyticsConfig,
	AnalyticsAdapter,
	AnalyticsAdapterConfig,
	Handler,
};

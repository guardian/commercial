import type { Bid } from 'prebid.js/dist/src/bidfactory';
import { EVENTS } from 'prebid.js/dist/src/constants';
import type { EventPayload } from 'prebid.js/dist/src/events';
import type { GuAnalyticsAdapter } from './utils';
import { getBidderCode } from './utils';

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

const GU_EVENTS = {
	AUCTION_END: EVENTS.AUCTION_END,
	AUCTION_INIT: EVENTS.AUCTION_INIT,
	BID_REQUESTED: EVENTS.BID_REQUESTED,
	BID_RESPONSE: EVENTS.BID_RESPONSE,
	BID_WON: EVENTS.BID_WON,
	NO_BID: EVENTS.NO_BID,
} as const;

interface GuEvents {
	[GU_EVENTS.AUCTION_END]: {
		ev: 'end';
		aid: string;
		ttr: number;
	};
	[GU_EVENTS.AUCTION_INIT]: {
		ev: 'init';
		aid: string;
		st: number;
	};
	[GU_EVENTS.BID_REQUESTED]: {
		ev: 'request';
		n: string;
		sid: string;
		bid: string;
		st: number;
	};
	[GU_EVENTS.BID_RESPONSE]: {
		ev: 'response';
		n: string;
		bid: string;
		sid: string;
		cpm: number;
		pb: string;
		cry: string;
		net: boolean;
		did: string;
		cid: string;
		sz: string;
		ttr: number;
		lid?: string;
		dsp?: number | string;
		adv?: string;
		bri?: string;
		brn?: string;
		add?: string;
	};
	[GU_EVENTS.BID_WON]: {
		ev: 'bidwon';
		aid: string;
		bid: string;
	};
	[GU_EVENTS.NO_BID]: {
		ev: 'nobid';
		n: string;
		bid: string;
		sid: string;
		aid: string;
		ttr: number;
	};
}

type GuEvent = GuEvents[keyof GuEvents];

function isEventKey<EventType extends keyof GuEvents>(
	key: string | number | symbol,
): key is keyof GuEvents[EventType] {
	return eventKeys.includes(key as (typeof eventKeys)[number]);
}

// Remove any properties that are undefined or null
function createEvent<EventType extends keyof GuEvents>(
	event: Partial<Nullable<GuEvents[EventType]>>,
): GuEvents[EventType] {
	if (!event.ev) {
		throw new Error('Event must have an "ev" property');
	}
	const cleanedEvent = Object.keys(event).reduce(
		(acc, key) => {
			if (
				isEventKey(key) &&
				event[key] !== undefined &&
				event[key] !== null
			) {
				acc[key] = event[key];
			}
			return acc;
		},
		{ ev: event.ev } as GuEvents[EventType],
	);

	return cleanedEvent;
}

type EventHandler<EventType extends keyof GuEvents> = (
	adapter: GuAnalyticsAdapter,
	args: EventPayload<EventType>,
) => Array<GuEvents[EventType]> | null;

type EventHandlers = { [K in keyof GuEvents]?: EventHandler<K> };

type GuBid = Bid & {
	meta: {
		networkId?: number | string;
		buyerId?: string;
		brandId?: string;
		brandName?: string;
		clickUrl?: string;
	};
};

type GuBidRequestArgs = EventPayload<'noBid'> & {
	bidderCode: string;
	requestId: string;
};

// Handlers for each event type, these create a loggable event from prebid event
const eventHandlers: EventHandlers = {
	[GU_EVENTS.AUCTION_END]: (adapter, args) => {
		const startTime = adapter.context?.auctionTimeStart;
		const duration = Date.now() - (startTime ?? 0);
		const event = createEvent<'auctionEnd'>({
			ev: 'end',
			aid: args.auctionId,
			ttr: duration,
		});

		return [event];
	},
	[EVENTS.AUCTION_INIT]: (adapter, args) => {
		if (adapter.context) {
			adapter.context.auctionTimeStart = Date.now();
		}
		const event = createEvent<'auctionInit'>({
			ev: 'init',
			aid: args.auctionId,
			st: adapter.context?.auctionTimeStart,
		});

		return [event];
	},
	[EVENTS.BID_REQUESTED]: (_, args) => {
		return args.bids.map((bid) => {
			const event = createEvent<'bidRequested'>({
				ev: 'request',
				n: args.bidderCode,
				sid: bid.adUnitCode,
				bid: bid.bidId,
				st: args.auctionStart,
			});

			return event;
		});
	},
	[EVENTS.BID_RESPONSE]: (_, args: GuBid) => {
		const event = createEvent<'bidResponse'>({
			ev: 'response',
			n: getBidderCode(args),
			bid: args.requestId,
			sid: args.adUnitCode,
			cpm: args.cpm,
			pb: args.pbCg,
			cry: args.currency,
			net: args.netRevenue,
			did: args.adId,
			cid: args.creativeId,
			sz: args.size,
			ttr: args.timeToRespond,
			lid: args.dealId,
			dsp: args.meta.networkId,
			adv: args.meta.buyerId,
			bri: args.meta.brandId,
			brn: args.meta.brandName,
			add: args.meta.clickUrl,
		});

		return [event];
	},
	[EVENTS.BID_WON]: (_, args) => {
		const event = createEvent<'bidWon'>({
			ev: 'bidwon',
			aid: args.auctionId,
			bid: args.requestId,
		});
		return [event];
	},
	[EVENTS.NO_BID]: (adapter, args) => {
		// the default args provided by prebid for noBid events don't include bidderCode and requestId, but we need those to create our event.
		const guArgs = args as unknown as GuBidRequestArgs;
		const duration = Date.now() - (adapter.context?.auctionTimeStart ?? 0);
		const event = createEvent<'noBid'>({
			ev: 'nobid',
			n: args.bidder || guArgs.bidderCode,
			bid: args.bidId || guArgs.requestId,
			sid: args.adUnitCode,
			aid: args.auctionId,
			ttr: duration,
		});

		return [event];
	},
};

function getHandler<EventType extends keyof GuEvents>(
	eventType: EventType,
): EventHandler<EventType> | null {
	const handler = eventHandlers[eventType];
	if (!handler) {
		return null;
	}
	return handler;
}

export { GU_EVENTS, getHandler, type GuEvent, type GuEvents };

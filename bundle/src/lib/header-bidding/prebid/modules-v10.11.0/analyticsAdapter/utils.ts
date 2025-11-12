// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import { EVENTS } from 'prebid-v10.11.0.js/src/constants';
import {
	type BidArgs,
	type EventData,
	eventKeys,
	type Handler,
	type RawEventData,
} from '../../../prebid-types';

/*
 * Update whenever you want to make sure you're sending the right version of analytics.
 * This is useful when some browsers are using old code and some new, for example.
 */
const VERSION = 10;

function getBidderCode(args: BidArgs): string {
	if (args.bidderCode !== 'ozone') return args.bidderCode ?? '';

	// Ozone represents several different advertisers
	if (args.adserverTargeting) {
		/**
		 * Each Ozone bid contains information about all the other bids.
		 * To pinpoint which advertiser is reponsible for the bid,
		 * we can match `adId` against the adserverTargeting key-values for each.
		 *
		 * For example, given `oz_appnexus_adId: "123abc456def789-0-0"`,
		 * we want to capture `appnexus` if `adId` matches `123abc456def789-0-0`
		 */
		for (const key in args.adserverTargeting) {
			const [, advertiser, info] = key.split('_');
			const value = args.adserverTargeting[key];
			if (info === 'adId' && value === args.adId) {
				return `ozone-${advertiser}`;
			}
		}

		// If none matched, use ozone's winner as fallback
		if (
			args.adserverTargeting.oz_winner &&
			typeof args.adserverTargeting.oz_winner === 'string'
		) {
			return `ozone-${args.adserverTargeting.oz_winner}`;
		}
	}

	return `ozone-unknown`;
}

function isEventKey(key: string): key is keyof EventData {
	return eventKeys.includes(key as keyof EventData);
}

// Remove any properties that are undefined or null
function createEvent(event: RawEventData): EventData {
	if (!event.ev) {
		throw new Error('Event must have an "ev" property');
	}
	const cleanedEvent: Partial<EventData> = {
		ev: event.ev,
	};
	for (const key in event) {
		if (
			isEventKey(key) &&
			event[key] !== undefined &&
			event[key] !== null
		) {
			cleanedEvent[key] = event[key];
		}
	}

	return cleanedEvent as EventData;
}

export type AnalyticsPayload = {
	v: number;
	pv: string;
	hb_ev: EventData[];
};

export const createPayload = (
	events: EventData[],
	pv: string,
): AnalyticsPayload => {
	return {
		v: VERSION,
		pv,
		hb_ev: events,
	};
};

// Handlers for each event type, these create a loggable event from prebid event
export const handlers = {
	[EVENTS.AUCTION_END]: (adapter, args) => {
		const duration = Date.now() - (adapter.context?.auctionTimeStart ?? 0);
		const event = createEvent({
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
		const event = createEvent({
			ev: 'init',
			aid: args.auctionId,
			st: adapter.context?.auctionTimeStart,
		});

		return [event];
	},
	[EVENTS.BID_REQUESTED]: (_, args) => {
		if (args.bids) {
			return args.bids.map((bid) => {
				const event = createEvent({
					ev: 'request',
					n: args.bidderCode,
					sid: bid.adUnitCode,
					bid: bid.bidId,
					st: args.start,
				});

				return event;
			});
		}
		return null;
	},
	[EVENTS.BID_RESPONSE]: (_, args) => {
		if (args.statusMessage === 'Bid available') {
			const event = createEvent({
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
				dsp: args.meta?.networkId,
				adv: args.meta?.buyerId,
				bri: args.meta?.brandId,
				brn: args.meta?.brandName,
				add: args.meta?.clickUrl,
			});

			return [event];
		}
		return null;
	},
	[EVENTS.BID_WON]: (_, args: BidArgs) => {
		const event = createEvent({
			ev: 'bidwon',
			aid: args.auctionId,
			bid: args.requestId,
		});
		return [event];
	},
	[EVENTS.NO_BID]: (adapter, args) => {
		const duration = Date.now() - (adapter.context?.auctionTimeStart ?? 0);
		const event = createEvent({
			ev: 'nobid',
			n: args.bidder ?? args.bidderCode,
			bid: args.bidId ?? args.requestId,
			sid: args.adUnitCode,
			aid: args.auctionId,
			ttr: duration,
		});

		return [event];
	},
} as const satisfies Record<string, Handler>;

export function logEvents(events: EventData[]): void {
	const isBid = events[0]?.ev === 'init';
	const isBidWon = events[0]?.ev === 'bidwon';
	let logMsg = '';
	if (isBid) {
		const slotId = events.find((e) => e.sid)?.sid;
		logMsg = `bids for ${slotId ?? 'unknown slot'}`;
	} else if (isBidWon) {
		const bidId = events[0]?.bid;
		logMsg = `bid won ${bidId ?? 'unknown bid'}`;
	}
	log('commercial', `prebid-v10.11.0.js events: ${logMsg}`, events);
}

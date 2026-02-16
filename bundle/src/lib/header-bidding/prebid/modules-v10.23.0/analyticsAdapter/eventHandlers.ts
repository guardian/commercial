import { EVENTS } from 'prebid-v10.23.0.js/dist/src/constants';
import type { Event } from 'prebid-v10.23.0.js/dist/src/events';
import {
	type BidArgs,
	type EventData,
	eventKeys,
	type RawEventData,
} from '../../../prebid-types';
import type { GuAnalyticsAdapter } from './utils';
import { getBidderCode } from './utils';

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

type EventHandlers = Partial<
	Record<
		Event,
		(adapter: GuAnalyticsAdapter, args: BidArgs) => EventData[] | null
	>
>;

// Handlers for each event type, these create a loggable event from prebid event
export const eventHandlers: EventHandlers = {
	[EVENTS.AUCTION_END]: (adapter, args) => {
		const startTime = adapter.context?.auctionTimeStart;
		const duration = Date.now() - (startTime ?? 0);
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
};

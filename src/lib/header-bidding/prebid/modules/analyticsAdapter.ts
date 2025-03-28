// see http://prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import adapter from 'prebid.js/libraries/analyticsAdapter/AnalyticsAdapter.js';
import adapterManager from 'prebid.js/src/adapterManager.js';
import { fetch } from 'prebid.js/src/ajax.js';
import { EVENTS } from 'prebid.js/src/constants.js';
import type {
	AnalyticsConfig,
	BidArgs,
	EventData,
	Handler,
} from '../../../../types/prebid';

/*
 * Update whenever you want to make sure you're sending the right version of analytics.
 * This is useful when some browsers are using old code and some new, for example.
 */
const VERSION = 9;

const SENDALL_ON: Record<string, boolean> = {
	[EVENTS.AUCTION_END]: true,
	[EVENTS.BID_WON]: true,
};

let queue: EventData[] = [];

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

function isPayloadValid(events: EventData[]): boolean {
	return (
		(events[0] && (events[0].ev === 'init' || events[0].ev === 'bidwon')) ??
		false
	);
}

function logEvents(events: EventData[]): void {
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
	log('commercial', `Prebid.js events: ${logMsg}`, events);
}

// Remove any properties that are undefined or null
function createEvent(event: EventData): EventData {
	const cleanedEvent: EventData = {
		ev: event.ev,
	};
	for (const key in event) {
		if (event[key] !== undefined && event[key] !== null) {
			cleanedEvent[key] = event[key];
		}
	}
	return cleanedEvent;
}

const handlers: Record<string, Handler> = {
	[EVENTS.AUCTION_INIT]: (adapter, args) => {
		if (adapter.context?.queue) {
			adapter.context.queue.init();
		}
		if (adapter.context) {
			adapter.context.auctionTimeStart = Date.now();
		}
		const event: EventData = {
			ev: 'init',
			aid: args.auctionId,
			st: adapter.context?.auctionTimeStart,
		};

		return [event];
	},
	[EVENTS.BID_REQUESTED]: (_, args) => {
		if (args.bids) {
			return args.bids.map((bid) => {
				const event: EventData = createEvent({
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
			const event: EventData = createEvent({
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
	[EVENTS.NO_BID]: (adapter, args) => {
		const duration = Date.now() - (adapter.context?.auctionTimeStart ?? 0);
		const event: EventData = createEvent({
			ev: 'nobid',
			n: args.bidder ?? args.bidderCode,
			bid: args.bidId ?? args.requestId,
			sid: args.adUnitCode,
			aid: args.auctionId,
			ttr: duration,
		});

		return [event];
	},
	[EVENTS.AUCTION_END]: (adapter, args) => {
		const duration = Date.now() - (adapter.context?.auctionTimeStart ?? 0);
		const event: EventData = createEvent({
			ev: 'end',
			aid: args.auctionId,
			ttr: duration,
		});

		return [event];
	},
	[EVENTS.BID_WON]: (_, args: BidArgs) => {
		const event: EventData = createEvent({
			ev: 'bidwon',
			aid: args.auctionId,
			bid: args.requestId,
		});
		return [event];
	},
};

const analyticsAdapter = Object.assign(adapter({ analyticsType: 'endpoint' }), {
	sendPayload(): void {
		const events = [...queue];
		queue = [];
		if (isPayloadValid(events) && analyticsAdapter.context?.ajaxUrl) {
			const req = {
				v: VERSION,
				pv: analyticsAdapter.context.pv,
				hb_ev: events,
			};
			fetch(analyticsAdapter.context.ajaxUrl, {
				method: 'POST',
				body: JSON.stringify(req),
				keepalive: true,
				headers: {
					'Content-Type': 'application/json',
				},
			})
				.then(async (response) => {
					if (!response.ok) {
						throw new Error(
							`Failed to send analytics payload: ${response.status}`,
						);
					}
					try {
						const data = (await response.json()) as unknown;
						if (
							data &&
							typeof data === 'object' &&
							'hb_ev' in data &&
							Array.isArray(data.hb_ev)
						) {
							logEvents(data.hb_ev);
						}
					} catch (e) {
						log(
							'commercial',
							'Failed to parse analytics payload',
							e,
						);
					}
				})
				.catch((e) => {
					log('commercial', 'Failed to send analytics payload', e);
				});
		}
	},
	track({ eventType, args }: { eventType: string; args: BidArgs }): void {
		if (!analyticsAdapter.context) {
			return;
		}
		const handler = handlers[eventType];
		if (handler) {
			const events = handler(analyticsAdapter, args);
			if (events) {
				if (eventType === EVENTS.BID_WON) {
					// clear queue to avoid sending late bids with bidWon event
					queue = [];
				}
				queue.push(...events);
			}
			if (SENDALL_ON[eventType]) {
				analyticsAdapter.sendPayload();
			}
		}
	},
});

analyticsAdapter.originEnableAnalytics = analyticsAdapter.enableAnalytics;

analyticsAdapter.enableAnalytics = (config: AnalyticsConfig): void => {
	if (!config.options.ajaxUrl) {
		log('commercial', "ajaxUrl is not defined. Analytics won't work");
		return;
	}
	if (!config.options.pv) {
		log('commercial', "pv is not defined. Analytics won't work");
		return;
	}
	analyticsAdapter.context = {
		ajaxUrl: config.options.ajaxUrl,
		pv: config.options.pv,
	};

	if (analyticsAdapter.originEnableAnalytics) {
		analyticsAdapter.originEnableAnalytics(config);
	}
};

adapterManager.registerAnalyticsAdapter({
	adapter: analyticsAdapter,
	code: 'gu',
});

export default analyticsAdapter;

export const _ = {
	getBidderCode,
};

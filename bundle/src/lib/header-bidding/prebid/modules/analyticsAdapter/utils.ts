// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import type adapter from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { type AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import type { Bid } from 'prebid.js/dist/src/types/summary/types';
import type { GuEvent, GuEvents } from './eventHandlers';

/*
 * Update whenever you want to make sure you're sending the right version of analytics.
 * This is useful when some browsers are using old code and some new, for example.
 */
const VERSION = 10;

type AnalyticsPayload = {
	v: number;
	pv: string;
	hb_ev: GuEvent[];
};

type GuAnalyticsAdapter = ReturnType<typeof adapter> & {
	context?: AnalyticsConfig<string>['options'] &
		Partial<{
			auctionTimeStart: number;
			pv: string;
			url: string;
		}>;
};

const createPayload = (events: GuEvent[], pv: string): AnalyticsPayload => {
	return {
		v: VERSION,
		pv,
		hb_ev: events,
	};
};

function getBidderCode(args: Bid): string {
	if (args.bidderCode !== 'ozone') return args.bidderCode || '';

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

const isBids = (
	args: Record<string, unknown>,
): args is GuEvents['bidResponse'] => {
	return typeof args === 'object' && 'ev' in args && args.ev === 'init';
};

const isBidWon = (
	args: Record<string, unknown>,
): args is GuEvents['bidWon'] => {
	return typeof args === 'object' && 'ev' in args && args.ev === 'bidwon';
};

const findSlotId = (events: GuEvent[]): string | undefined => {
	return events.find(
		(event): event is GuEvents['bidResponse'] => 'sid' in event,
	)?.sid;
};

function logEvents(events: GuEvent[]): void {
	const firstEvent = events[0] ?? {};

	let logMsg = '';
	if (isBids(firstEvent)) {
		const slotId = findSlotId(events) ?? 'unknown slot';
		logMsg = `bids for ${slotId}`;
	} else if (isBidWon(firstEvent)) {
		const bidId = firstEvent.bid;
		logMsg = `bid won ${bidId}`;
	}
	log('commercial', `prebid.js events: ${logMsg}`, events);
}

export {
	createPayload,
	getBidderCode,
	logEvents,
	type GuAnalyticsAdapter,
	type AnalyticsPayload,
};

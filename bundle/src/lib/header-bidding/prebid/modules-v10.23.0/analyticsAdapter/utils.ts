// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import type adapter from 'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { type AnalyticsConfig } from 'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { type BidArgs, type EventData } from '../../../prebid-types';

/*
 * Update whenever you want to make sure you're sending the right version of analytics.
 * This is useful when some browsers are using old code and some new, for example.
 */
const VERSION = 10;

export type AnalyticsPayload = {
	v: number;
	pv: string;
	hb_ev: EventData[];
};

export type GuAnalyticsAdapter = ReturnType<typeof adapter> & {
	context?: AnalyticsConfig<string>['options'] &
		Partial<{
			auctionTimeStart: number;
			pv: string;
			url: string;
		}>;
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

export function getBidderCode(args: BidArgs): string {
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
	log('commercial', `prebid-v10.23.0.js events: ${logMsg}`, events);
}

// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import adapter from 'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import adapterManager from 'prebid-v10.23.0.js/dist/src/adapterManager';
import { EVENTS } from 'prebid-v10.23.0.js/dist/src/constants';
import { reportError } from '../../../../error/report-error';
import type { BidArgs, EventData } from '../../../prebid-types';
import { eventHandlers } from './eventHandlers';
import { sendPayload } from './sendPayload';
import { createPayload, type GuAnalyticsAdapter } from './utils';

let queue: EventData[] = [];

const analyticsAdapter: GuAnalyticsAdapter = Object.assign(
	adapter({ analyticsType: 'endpoint' }),
	{
		// only exposed for testing, not part of the public API of the adapter
		track({
			eventType,
			args,
		}: {
			eventType: (typeof EVENTS)[keyof typeof EVENTS];
			args: BidArgs;
		}): void {
			const handler = eventHandlers[eventType];
			if (handler) {
				const events = handler(analyticsAdapter, args);
				if (events) {
					if (eventType === EVENTS.BID_WON) {
						// clear queue to avoid sending late bids with bidWon event
						queue = [];
					}
					queue.push(...events);
				}

				if (
					eventType === EVENTS.AUCTION_END ||
					eventType === EVENTS.BID_WON
				) {
					const { pv, url } = analyticsAdapter.context ?? {};

					// this should never happen, but if context isn't defined
					// we can't send the event, so we log an error and return
					if (!pv || !url) {
						const errorDetails = { eventType, args, pv, url };
						const err = new Error(
							'context is not defined, prebid event not being logged',
						);
						reportError(err, 'commercial', {}, errorDetails);
						log(
							'commercial',
							'context is not defined, prebid event not being logged',
							errorDetails,
						);
						return;
					}

					const events = [...queue];
					queue = [];
					const payload = createPayload(events, pv);
					void sendPayload(url, payload);
				}
			}
		},
	},
);

const originalEnableAnalytics = analyticsAdapter.enableAnalytics;

analyticsAdapter.enableAnalytics = (config): void => {
	analyticsAdapter.context = config.options ?? {};
	originalEnableAnalytics(config);
};

adapterManager.registerAnalyticsAdapter({
	adapter: analyticsAdapter,
	code: 'gu',
});

export default analyticsAdapter;

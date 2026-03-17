// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import adapter from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import adapterManager from 'prebid.js/dist/src/adapterManager';
import { EVENTS } from 'prebid.js/dist/src/constants';
import type { EventPayload } from 'prebid.js/dist/src/events';
import { reportError } from '../../../../error/report-error';
import type { GuEvent, GuEvents } from './eventHandlers';
import { getHandler } from './eventHandlers';
import { sendPayload } from './sendPayload';
import { createPayload, type GuAnalyticsAdapter } from './utils';

let eventQueue: GuEvent[] = [];

const flushEventQueue = (): GuEvent[] => {
	const events = [...eventQueue];
	eventQueue = [];
	return events;
};

const analyticsAdapter: GuAnalyticsAdapter = Object.assign(
	adapter({ analyticsType: 'endpoint' }),
	{
		track<
			EventType extends keyof GuEvents,
			Args extends EventPayload<EventType>,
		>({ eventType, args }: { eventType: EventType; args: Args }): void {
			const handler = getHandler(eventType);
			if (handler) {
				const events = handler(analyticsAdapter, args);
				if (events) {
					if (eventType === EVENTS.BID_WON) {
						// clear queue to avoid sending late bids with bidWon event
						eventQueue = [];
					}
					eventQueue.push(...events);
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

					const events = flushEventQueue();
					const payload = createPayload(events, pv);
					void sendPayload(url, payload);
				}
			}
		},
	},
);

const originalEnableAnalytics =
	analyticsAdapter.enableAnalytics.bind(analyticsAdapter);

analyticsAdapter.enableAnalytics = (config): void => {
	analyticsAdapter.context = config.options ?? {};
	originalEnableAnalytics(config);
};

adapterManager.registerAnalyticsAdapter({
	adapter: analyticsAdapter,
	code: 'gu',
});

export { flushEventQueue };

export default analyticsAdapter;

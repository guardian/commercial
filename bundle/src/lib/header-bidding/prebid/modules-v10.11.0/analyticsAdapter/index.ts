// see http://docs.prebid.org/dev-docs/integrate-with-the-prebid-analytics-api.html
import { log } from '@guardian/libs';
import adapter from 'prebid-v10.11.0.js/libraries/analyticsAdapter/AnalyticsAdapter';
import adapterManager from 'prebid-v10.11.0.js/src/adapterManager';
import { fetch } from 'prebid-v10.11.0.js/src/ajax';
import { EVENTS } from 'prebid-v10.11.0.js/src/constants';
import { reportError } from '../../../../../lib/error/report-error';
import type { BidArgs, EventData } from '../../../prebid-types';
import {
	type AnalyticsPayload,
	createPayload,
	handlers,
	logEvents,
} from './utils';

let queue: EventData[] = [];

const analyticsAdapter = Object.assign(adapter({ analyticsType: 'endpoint' }), {
	sendPayload: async (
		url: string,
		payload: AnalyticsPayload,
	): Promise<void> => {
		const events = [...queue];
		queue = [];
		try {
			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify(payload),
				keepalive: true,
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to send analytics payload: ${
						response.statusText
					} (${response.status})`,
				);
			}
			logEvents(events);
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				// Ignore abort errors, they are expected when the fetch times out
				return;
			}

			const feature = 'commercial';
			const extras = { events };
			reportError(error, feature, {}, extras);
		}
	},
	track({
		eventType,
		args,
	}: {
		eventType: (typeof EVENTS)[keyof typeof EVENTS];
		args: BidArgs;
	}): void {
		if (!analyticsAdapter.context) {
			// this should never happen
			const feature = 'commercial';
			const extras = { args, eventType };
			const message =
				'context is not defined, prebid event not being logged';
			reportError(new Error(message), feature, {}, extras);
			log(feature, message);
			return;
		}

		const handler = handlers[eventType];
		if (handler) {
			const events = handler(analyticsAdapter, args);
			const isEndingEvent =
				eventType === EVENTS.AUCTION_END ||
				eventType === EVENTS.BID_WON;

			if (events) {
				// clear queue to avoid sending late bids with bid won event
				if (eventType === EVENTS.BID_WON) {
					queue = [];
				}
				queue.push(...events);
			}

			if (isEndingEvent) {
				const { pv, url } = analyticsAdapter.context;
				const events = [...queue];

				// clear queue
				queue = [];
				const payload = createPayload(events, pv);
				void analyticsAdapter.sendPayload(url, payload);
			}
		}
	},
});

analyticsAdapter.originEnableAnalytics = analyticsAdapter.enableAnalytics;

analyticsAdapter.enableAnalytics = (config): void => {
	analyticsAdapter.context = {
		url: config.options.url,
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

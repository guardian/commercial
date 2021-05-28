import { log } from '@guardian/libs';
import { EventTimer } from './EventTimer';

type CommercialMetrics = {
	browser_id?: string;
	page_view_id: string;
	received_timestamp: string;
	received_date: string;
	platform: string;
	metrics: Metrics[];
	properties: Properties[];
};

type Metrics = {
	name: string;
	value: number;
};

type Properties = {
	name: string;
	value: string;
};

export function sendCommercialMetrics(
	pageViewId: string,
	browserId: string | undefined,
	isDev: boolean,
): boolean {
	const devProperties: Properties[] = isDev
		? [{ name: 'isDev', value: window.location.hostname }]
		: [];

	const endpoint = isDev
		? '//performance-events.code.dev-guardianapis.com/commercial-metrics'
		: '//performance-events.guardianapis.com/commercial-metrics';
	if (document.visibilityState !== 'hidden') return false;

	const timestamp = new Date().toISOString();
	const date = timestamp.slice(0, 10);
	const eventTimer = EventTimer.get();
	const events = eventTimer.events;

	const properties: Properties[] = Object.entries(eventTimer.properties)
		.map((property) => {
			const [name, value] = property;
			return { name, value: String(value) };
		})
		.concat(devProperties);

	const metrics: Metrics[] = events.map((event) => {
		return { name: event.name, value: Math.ceil(event.ts) };
	});

	const commercialMetrics: CommercialMetrics = {
		browser_id: browserId,
		page_view_id: pageViewId,
		received_timestamp: timestamp,
		received_date: date,
		platform: 'NEXT_GEN',
		metrics,
		properties,
	};

	log('commercial', 'About to send commercial metrics', commercialMetrics);
	return navigator.sendBeacon(endpoint, JSON.stringify(commercialMetrics));
}

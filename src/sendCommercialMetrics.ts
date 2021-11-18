import { log } from '@guardian/libs';
import { EventTimer } from './EventTimer';

type Metrics = {
	name: string;
	value: number;
};

type Properties = {
	name: string;
	value: string;
};

type CommercialMetrics = {
	browser_id?: string;
	page_view_id: string;
	platform: string;
	metrics: readonly Metrics[];
	properties: readonly Properties[];
};

export function sendCommercialMetrics(
	pageViewId: string,
	browserId: string | undefined,
	isDev: boolean,
	adBlockerInUse?: boolean,
): boolean {
	const devProperties: Properties[] = isDev
		? [{ name: 'isDev', value: window.location.hostname }]
		: [];
	const adBlockerProperties: Properties[] =
		adBlockerInUse !== undefined
			? [
					{
						name: 'adBlockerInUse',
						value: adBlockerInUse.toString(),
					},
			  ]
			: [];

	const endpoint = isDev
		? '//performance-events.code.dev-guardianapis.com/commercial-metrics'
		: '//performance-events.guardianapis.com/commercial-metrics';
	if (document.visibilityState !== 'hidden') return false;

	const eventTimer = EventTimer.get();
	const events = eventTimer.events;

	const properties: readonly Properties[] = Object.entries(
		eventTimer.properties,
	)
		.filter(([, value]) => typeof value !== 'undefined')
		.map(([name, value]) => ({ name, value: String(value) }))
		.concat(devProperties)
		.concat(adBlockerProperties);

	const metrics: readonly Metrics[] = events.map(({ name, ts }) => ({
		name,
		value: Math.ceil(ts),
	}));

	const commercialMetrics: CommercialMetrics = {
		browser_id: browserId,
		page_view_id: pageViewId,
		platform: 'NEXT_GEN',
		metrics,
		properties,
	};

	log('commercial', 'About to send commercial metrics', commercialMetrics);
	return navigator.sendBeacon(endpoint, JSON.stringify(commercialMetrics));
}

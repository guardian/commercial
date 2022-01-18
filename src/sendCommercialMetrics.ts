import { log } from '@guardian/libs';
import { EventTimer } from './EventTimer';

type Metric = {
	name: string;
	value: number;
};

type Property = {
	name: string;
	value: string | number;
};

type Event = {
	name: string;
	ts: number;
};

type EventProperties = {
	type?: ConnectionType;
	downlink?: number;
	effectiveType?: string;
};

type CommercialMetricsPayload = {
	page_view_id: string | null;
	browser_id?: string | null;
	platform: 'NEXT_GEN';
	metrics: readonly Metric[] | null;
	properties: readonly Property[] | null;
};

enum Endpoints {
	CODE = '//performance-events.code.dev-guardianapis.com/commercial-metrics',
	PROD = '//performance-events.guardianapis.com/commercial-metrics',
}

const commercialMetricsPayload: CommercialMetricsPayload = {
	page_view_id: null,
	browser_id: null,
	platform: 'NEXT_GEN',
	metrics: null,
	properties: null,
};

const getEndpoint = (isDev: boolean) => {
	return isDev ? Endpoints.CODE : Endpoints.PROD;
};

const getDevProperties = (isDev: boolean): Property[] => {
	return isDev ? [{ name: 'isDev', value: window.location.hostname }] : [];
};

const getAdBlockerProperties = (adBlockerInUse?: boolean): Property[] => {
	return adBlockerInUse !== undefined
		? [
				{
					name: 'adBlockerInUse',
					value: adBlockerInUse.toString(),
				},
		  ]
		: [];
};

const filterUndefinedEventTimerProperties = (
	eventTimerProperties: EventProperties,
): Array<[string, string | number]> => {
	return Object.entries(eventTimerProperties).filter(
		([, value]) => typeof value !== 'undefined',
	);
};

const mapEventTimerPropertiesToString = (
	properties: Array<[string, string | number]>,
): Property[] => {
	return properties.map(([name, value]) => ({
		name: String(name),
		value: String(value),
	}));
};

// Ask Max - not sure what this is doing
const roundTimeStamp = (events: Event[]): Metric[] => {
	return events.map(({ name, ts }) => ({
		name,
		value: Math.ceil(ts),
	}));
};

function sendCommercialMetrics(isDev: boolean) {
	const endpoint = getEndpoint(isDev);

	log(
		'commercial',
		'About to send commercial metrics',
		commercialMetricsPayload,
	);
	return navigator.sendBeacon(
		endpoint,
		JSON.stringify(commercialMetricsPayload),
	);
}

export function initCommercialMetrics(
	pageViewId: string,
	browserId: string | undefined,
	isDev: boolean,
	adBlockerInUse?: boolean,
): boolean {
	// Ask Max - why does this need to be hidden?
	if (document.visibilityState !== 'hidden') {
		return false;
	}
	commercialMetricsPayload.page_view_id = pageViewId;
	commercialMetricsPayload.browser_id = browserId;

	// Assemble commercial properties and metrics
	const devProperties: Property[] = getDevProperties(isDev);
	const adBlockerProperties: Property[] =
		getAdBlockerProperties(adBlockerInUse);
	const eventTimer = EventTimer.get();
	const filteredEventTimerProperties: Array<[string, string | number]> =
		filterUndefinedEventTimerProperties(eventTimer.properties);
	const mappedEventTimerProperties: Property[] =
		mapEventTimerPropertiesToString(filteredEventTimerProperties);

	const properties: readonly Property[] = mappedEventTimerProperties
		.concat(devProperties)
		.concat(adBlockerProperties);
	commercialMetricsPayload.properties = properties;

	const metrics: readonly Metric[] = roundTimeStamp(eventTimer.events);
	commercialMetricsPayload.metrics = metrics;

	sendCommercialMetrics(isDev);

	return true;
}

export const _ = {
	Endpoints,
	getEndpoint,
	getDevProperties,
	getAdBlockerProperties,
	filterUndefinedEventTimerProperties,
	mapEventTimerPropertiesToString,
	roundTimeStamp,
};

export type { Property, Event, Metric };

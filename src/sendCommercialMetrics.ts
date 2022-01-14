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

type CommercialMetrics = {
	browser_id?: string;
	page_view_id: string;
	platform: 'NEXT_GEN';
	metrics: readonly Metric[];
	properties: readonly Property[];
};

enum Endpoints {
	CODE = '//performance-events.code.dev-guardianapis.com/commercial-metrics',
	PROD = '//performance-events.guardianapis.com/commercial-metrics',
}

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

function sendCommercialMetrics(
	pageViewId: string,
	browserId: string | undefined,
	isDev: boolean,
	adBlockerInUse?: boolean,
): boolean {
	// Ask Max
	if (document.visibilityState !== 'hidden') {
		return false;
	}

	const endpoint = getEndpoint(isDev);

	// Assemble commercial metrics
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

	const metrics: readonly Metric[] = roundTimeStamp(eventTimer.events);

	// And finally we build the commercialMetrics object to pass on to logging and sendBeacon, drumroll
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

export {
	Endpoints,
	sendCommercialMetrics,
	getEndpoint,
	getDevProperties,
	getAdBlockerProperties,
	filterUndefinedEventTimerProperties,
	mapEventTimerPropertiesToString,
	roundTimeStamp,
	type Property,
	type Event,
	type Metric,
};

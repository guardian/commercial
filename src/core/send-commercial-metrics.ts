import { onConsent } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { TeamName } from '@guardian/libs';
import { getMeasures, isNonNullable, log } from '@guardian/libs';
import { EventTimer } from './event-timer';
import type { ConnectionType } from './types';

type Metric = {
	name: string;
	value: number;
};

type Property = {
	name: string;
	value: string;
};

type TimedEvent = {
	name: string;
	ts: number;
};

type DurationEvent = {
	name: string;
	duration: number;
};

type EventProperties = {
	type?: ConnectionType;
	downlink?: number;
	effectiveType?: string;
};

type CommercialMetricsPayload = {
	page_view_id?: string;
	browser_id?: string;
	platform?: 'NEXT_GEN';
	metrics?: readonly Metric[];
	properties?: readonly Property[];
};

enum Endpoints {
	CODE = '//performance-events.code.dev-guardianapis.com/commercial-metrics',
	PROD = '//performance-events.guardianapis.com/commercial-metrics',
}

let commercialMetricsPayload: CommercialMetricsPayload = {
	page_view_id: undefined,
	browser_id: undefined,
	platform: 'NEXT_GEN',
	metrics: [],
	properties: [],
};

let devProperties: Property[] | [] = [];
let adBlockerProperties: Property[] | [] = [];
let initialised = false;
let endpoint: Endpoints;

const setEndpoint = (isDev: boolean) =>
	(endpoint = isDev ? Endpoints.CODE : Endpoints.PROD);

const setDevProperties = (isDev: boolean) =>
	(devProperties = isDev
		? [{ name: 'isDev', value: window.location.hostname }]
		: []);

const setAdBlockerProperties = (adBlockerInUse?: boolean): void => {
	adBlockerProperties =
		adBlockerInUse !== undefined
			? [
					{
						name: 'adBlockerInUse',
						value: adBlockerInUse.toString(),
					},
			  ]
			: [];
};

const transformToObjectEntries = (
	eventTimerProperties: EventProperties,
): Array<[string, string | number | undefined]> => {
	// Transforms object {key: value} pairs into an array of [key, value] arrays
	return Object.entries(eventTimerProperties);
};

const mapEventTimerPropertiesToString = (
	properties: Array<[string, string | number]>,
): Property[] => {
	return properties.map(([name, value]) => ({
		name: String(name),
		value: String(value),
	}));
};

const roundTimeStamp = (
	events: TimedEvent[],
	measures: DurationEvent[],
): Metric[] => {
	const roundedEvents = events.map(({ name, ts }) => ({
		name,
		value: Math.ceil(ts),
	}));

	const roundedMeasures = measures.map(({ name, duration }) => ({
		name,
		value: Math.ceil(duration),
	}));

	return [...roundedEvents, ...roundedMeasures];
};

function sendMetrics() {
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

type ArrayMetric = [key: string, value: string | number];

/**
 * Gather how many times the user has experienced the “offline” event
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/offline_event
 *
 * This value should be fetched as late as possible in the page lifecycle,
 * to get an accurate value.
 *
 * Relevant for an @guardian/open-journalism investigation.
 */
const getOfflineCount = (): Metric[] =>
	typeof window.guardian.offlineCount === 'number'
		? [
				{
					name: 'offlineCount',
					value: window.guardian.offlineCount,
				},
		  ]
		: [];

/**
 * Measures added with @guardian/libs’s `startPerformanceMeasure`
 *
 * Allows for more granular monitoring of web page performance.
 */
const getPerformanceMeasures = (...teams: TeamName[]): Metric[] =>
	getMeasures(teams).map(({ detail: { team, name, action }, duration }) => ({
		name: [team, name, action].filter(isNonNullable).join('_'),
		value: duration,
	}));

function gatherMetricsOnPageUnload(): void {
	// Assemble commercial properties and metrics
	const eventTimer = EventTimer.get();
	const transformedEntries = transformToObjectEntries(eventTimer.properties);
	const filteredEventTimerProperties = transformedEntries.filter<ArrayMetric>(
		(item): item is ArrayMetric => typeof item[1] !== 'undefined',
	);
	const mappedEventTimerProperties = mapEventTimerPropertiesToString(
		filteredEventTimerProperties,
	);

	const properties: readonly Property[] = mappedEventTimerProperties
		.concat(devProperties)
		.concat(adBlockerProperties);
	commercialMetricsPayload.properties = properties;

	const metrics: readonly Metric[] = roundTimeStamp(
		eventTimer.marks,
		eventTimer.measures,
	)
		.concat(getOfflineCount())
		.concat(getPerformanceMeasures('dotcom'));
	commercialMetricsPayload.metrics = metrics;

	sendMetrics();
}

const listener = (e: Event): void => {
	switch (e.type) {
		case 'visibilitychange':
			if (document.visibilityState === 'hidden') {
				gatherMetricsOnPageUnload();
			}
			return;
		case 'pagehide':
			gatherMetricsOnPageUnload();
			return;
	}
};

const addVisibilityListeners = (): void => {
	// Report all available metrics when the page is unloaded or in background.
	window.addEventListener('visibilitychange', listener, { once: true });

	// Safari does not reliably fire the `visibilitychange` on page unload.
	window.addEventListener('pagehide', listener, { once: true });
};

const checkConsent = async (): Promise<boolean> => {
	const consentState: ConsentState = await onConsent();

	if (consentState.tcfv2) {
		// TCFv2 mode - check for consent
		const consents = consentState.tcfv2.consents;
		const REQUIRED_CONSENTS = [7, 8];

		return REQUIRED_CONSENTS.every((consent) => consents[consent]);
	}

	// non-TCFv2 mode - don't check for consent
	return true;
};

/**
 * A method to asynchronously send metrics after initialization.
 */
async function bypassCommercialMetricsSampling(): Promise<void> {
	if (!initialised) {
		console.warn('initCommercialMetrics not yet initialised');
		return;
	}

	const consented = await checkConsent();

	if (consented) {
		addVisibilityListeners();
	} else {
		log('commercial', "Metrics won't be sent because consent wasn't given");
	}
}

interface InitCommercialMetricsArgs {
	pageViewId: string;
	browserId: string | undefined;
	isDev: boolean;
	adBlockerInUse?: boolean;
	sampling?: number;
}

/**
 * A method to initialise metrics.
 * Note: this is initialised in the frontend/DCR bundles, not the commercial bundle.
 * @param init.pageViewId - identifies the page view. Usually available on `guardian.config.ophan.pageViewId`. Defaults to `null`
 * @param init.browserId - identifies the browser. Usually available via `getCookie({ name: 'bwid' })`. Defaults to `null`
 * @param init.isDev - used to determine whether to use CODE or PROD endpoints.
 * @param init.adBlockerInUse - indicates whether or not an adblocker is being used.
 * @param init.sampling - rate at which to sample commercial metrics - the default is to send for 1% of pageviews
 */
async function initCommercialMetrics({
	pageViewId,
	browserId,
	isDev,
	adBlockerInUse,
	sampling = 1 / 100,
}: InitCommercialMetricsArgs): Promise<boolean> {
	commercialMetricsPayload.page_view_id = pageViewId;
	commercialMetricsPayload.browser_id = browserId;
	setEndpoint(isDev);
	setDevProperties(isDev);
	setAdBlockerProperties(adBlockerInUse);

	if (initialised) {
		return false;
	}

	initialised = true;

	const userIsInSamplingGroup = Math.random() <= sampling;

	if (isDev || userIsInSamplingGroup) {
		const consented = await checkConsent();
		if (consented) {
			addVisibilityListeners();
			return true;
		}
		log('commercial', "Metrics won't be sent because consent wasn't given");
	}

	return false;
}

export const _ = {
	Endpoints,
	setEndpoint,
	mapEventTimerPropertiesToString,
	roundTimeStamp,
	transformToObjectEntries,
	reset: (): void => {
		initialised = false;
		commercialMetricsPayload = {
			page_view_id: undefined,
			browser_id: undefined,
			platform: 'NEXT_GEN',
			metrics: [],
			properties: [],
		};
		removeEventListener('visibilitychange', listener);
		removeEventListener('pagehide', listener);
	},
};

export type { Property, TimedEvent, Metric };
export { bypassCommercialMetricsSampling, initCommercialMetrics };

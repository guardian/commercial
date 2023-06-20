import { onConsent } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { isNonNullable, log } from '@guardian/libs';
import type { EventTimerProperties } from './event-timer';
import { EventTimer } from './event-timer';

/**
 * For numerical data of type `number`.
 *
 * Anything that can be measured discretely or continuously:
 * - size of element
 * - number of elements
 * - duration of event
 * - occurrences of event
 *
 * @see [Quantitative Data](https://en.wikibooks.org/wiki/Statistics/Different_Types_of_Data/Quantitative_and_Qualitative_Data#Quantitative_data)
 *
 * @example
 * const data: Metric[] = [
 * 	{ name: "time on page", value: 10_320 },
 * 	{ name: "height of banner", value: 360 },
 * 	{ name: "cumulative layout shift", value: 0.0625 },
 * ]
 */
type Metric = {
	name: string;
	value: number;
};

/**
 * For categorical data of type `string`.
 *
 * Anything that can be identified with distinct labels:
 * - edition
 * - host name
 * - name of element
 * - type of connection
 *
 * @see [Qualitative Data](https://en.wikibooks.org/wiki/Statistics/Different_Types_of_Data/Quantitative_and_Qualitative_Data#Qualitative_data)
 *
 * @example
 * const data: Property[] = [
 * 	{ name: "edition", value: "UK" },
 * 	{ name: "content ID", value: "/2023/feb/23/…" },
 * 	{ name: "connection type", value: "4g" },
 * ]
 */
type Property = {
	name: string;
	value: string;
};

/**
 * Individual measurement. Latin singular form of “data”.
 * Can be either:
 * - qualitative (`string`)
 * - quantitative (`number`)
 *
 * @see Data
 * @see [Quantitative and Qualitative Data](https://en.wikibooks.org/wiki/Statistics/Different_Types_of_Data/Quantitative_and_Qualitative_Data)
 */
type Datum = Metric | Property;
type Data = Datum[];

type TimedEvent = {
	name: string;
	ts: number;
};

type CommercialMetricsPayload = {
	page_view_id?: string;
	browser_id?: string;
	platform?: 'NEXT_GEN';
	/** Data of type `number`. Also known as numerical or ordinal. */
	metrics?: readonly Metric[];
	/** Data of type `string`. Also known as categorical and nominal. */
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

let devProperties: Property[] = [];
let adBlockerProperties: Property[] = [];
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

/** @deprecated consider removing this transformation once the data analysis is set up */
const mapEventTimerPropertiesToString = (
	properties: EventTimerProperties,
): Record<string, string> =>
	Object.fromEntries(
		Object.entries(properties).map(([name, value]) => [
			name,
			String(value),
		]),
	);

const isProperty = (datum: Datum): datum is Property =>
	typeof datum.value === 'string';

const isMetric = (datum: Datum): datum is Metric =>
	typeof datum.value === 'number';

const transformObjectToData = (
	eventTimerProperties: Record<string, string | number | undefined>,
): { properties: Property[]; metrics: Metric[] } => {
	const data: Data = Object.entries(eventTimerProperties)
		.map(([name, value]) => {
			switch (typeof value) {
				case 'string':
					return { name, value };
				case 'number':
					return { name, value };
				default:
					return undefined;
			}
		})
		.filter(isNonNullable);

	return {
		properties: data.filter(isProperty),
		metrics: data.filter(isMetric),
	};
};

const roundTimeStamp = (events: TimedEvent[]): Metric[] => {
	return events.map(({ name, ts }) => ({
		name,
		value: Math.ceil(ts),
	}));
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

function gatherMetricsOnPageUnload(): void {
	// Assemble commercial properties and metrics
	const eventTimer = EventTimer.get();

	const data = transformObjectToData(
		mapEventTimerPropertiesToString(eventTimer.properties),
	);

	const properties: readonly Property[] = data.properties
		.concat(devProperties)
		.concat(adBlockerProperties);
	commercialMetricsPayload.properties = properties;

	const metrics: readonly Metric[] = data.metrics
		.concat(roundTimeStamp(eventTimer.events))
		.concat(getOfflineCount());
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
		} else {
			log(
				'commercial',
				"Metrics won't be sent because consent wasn't given",
			);
		}
	}

	return false;
}

export const _ = {
	Endpoints,
	setEndpoint,
	roundTimeStamp,
	transformObjectToData,
	mapEventTimerPropertiesToString,
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

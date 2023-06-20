import { onConsent } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import { log } from '@guardian/libs';
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
 * const data: Quantitative[] = [
 * 	{ name: "time on page", value: 10_320 },
 * 	{ name: "height of banner", value: 360 },
 * 	{ name: "cumulative layout shift", value: 0.0625 },
 * ]
 */
type Quantitative = {
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
 * const data: Qualitative[] = [
 * 	{ name: "edition", value: "UK" },
 * 	{ name: "content ID", value: "/2023/feb/23/…" },
 * 	{ name: "connection type", value: "4g" },
 * ]
 */
type Qualitative = {
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
type Datum = Quantitative | Qualitative;
type Data = Datum[];

type TimedEvent = {
	name: string;
	ts: number;
};

type CommercialMetricsPayload = {
	page_view_id?: string;
	browser_id?: string;
	platform?: 'NEXT_GEN';
	/** Data of type `number`. Also known as ordinal and numerical. */
	metrics?: readonly Quantitative[];
	/** Data of type `string`. Also known as categorical and nominal. */
	properties?: readonly Qualitative[];
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

let devData: Qualitative[] = [];
let adBlockerData: Qualitative[] = [];
let initialised = false;
let endpoint: Endpoints;

const setEndpoint = (isDev: boolean) =>
	(endpoint = isDev ? Endpoints.CODE : Endpoints.PROD);

const setDevData = (isDev: boolean) =>
	(devData = isDev
		? [{ name: 'isDev', value: window.location.hostname }]
		: []);

const setAdBlockerData = (adBlockerInUse?: boolean): void => {
	adBlockerData =
		adBlockerInUse !== undefined
			? [
					{
						name: 'adBlockerInUse',
						value: adBlockerInUse.toString(),
					},
			  ]
			: [];
};

const isQualitative = (datum: Datum): datum is Qualitative =>
	typeof datum.value === 'string';

const isQuantitative = (datum: Datum): datum is Quantitative =>
	typeof datum.value === 'number';

const transformPropertiesObjectToData = (
	eventTimerProperties: Pick<
		EventTimerProperties,
		'type' | 'downlink' | 'effectiveType'
	>,
): [Qualitative[], Quantitative[]] => {
	const data: Data = Object.entries(eventTimerProperties)
		.filter(
			(datum: [string, unknown]): datum is [string, string | number] =>
				typeof datum[1] === 'string' || typeof datum[1] === 'number',
		)
		.map(([name, value]) =>
			typeof value === 'string' ? { name, value } : { name, value },
		);

	return [data.filter(isQualitative), data.filter(isQuantitative)];
};

const roundTimeStamp = (events: TimedEvent[]): Quantitative[] => {
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
const getOfflineCount = (): Quantitative[] =>
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
	const [qualitativeProperties, quantitativeProperties] =
		transformPropertiesObjectToData(eventTimer.properties);

	/**
	 * Temporary measure to keep previous behaviour around
	 *
	 * @todo remove in next major version
	 * @deprecated
	 */
	const quantitativeAsQualitative = quantitativeProperties.map(
		({ name, value }) => ({ name, value: String(value) }),
	);

	const qualitativeData: readonly Qualitative[] = qualitativeProperties
		.concat(quantitativeAsQualitative)
		.concat(devData)
		.concat(adBlockerData);
	commercialMetricsPayload.properties = qualitativeData;

	const quantitativeData: readonly Quantitative[] = quantitativeProperties
		.concat(roundTimeStamp(eventTimer.events))
		.concat(getOfflineCount());
	commercialMetricsPayload.metrics = quantitativeData;

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
	setDevData(isDev);
	setAdBlockerData(adBlockerInUse);

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
	transformPropertiesObjectToData,
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

export type { Qualitative, TimedEvent, Quantitative };
export { bypassCommercialMetricsSampling, initCommercialMetrics };

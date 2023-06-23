import { log } from '@guardian/libs';
import type { ConnectionType } from './types';

const supportsPerformanceAPI = () =>
	typeof window !== 'undefined' &&
	typeof window.performance !== 'undefined' &&
	typeof window.performance.mark === 'function';

interface EventTimerProperties {
	type?: ConnectionType;
	downlink?: number;
	effectiveType?: string;
	adSlotsInline?: number;
	adSlotsTotal?: number;
	// the height of the page / the viewport height
	pageHeightVH?: number;
	gpcSignal?: number;
	// distance in percentage of viewport height at which ads are lazy loaded
	lazyLoadMarginPercent?: number;
	hasLabsContainer?: boolean;
	labsUrl?: string;
}

// Events will be logged using the performance API for all slots, but only these slots will be tracked as commercial metrics
const trackedSlots = ['top-above-nav', 'inline1', 'inline2'] as const;

type TrackedSlots = (typeof trackedSlots)[number];

// marks that we want to save as commercial metrics
const slotMarks = ['adOnPage'] as const;

// measures that we want to save as commercial metrics
const slotMeasures = ['adRender', 'defineSlot', 'prebid', 'loadAd'] as const;

// all marks, including the measure start and end marks
const allSlotMarks = [
	...slotMarks,
	...slotMeasures.map((measure) => `${measure}Start`),
	...slotMeasures.map((measure) => `${measure}End`),
] as const;

enum ExternalEvents {
	CmpInit = 'cmp-init',
	CmpUiDisplayed = 'cmp-ui-displayed',
	CmpGotConsent = 'cmp-got-consent',
}

const isSlotMark = (eventName: string) => allSlotMarks.includes(eventName);

const shouldSaveMark = (eventName: string) =>
	eventName === 'adOnPage' ||
	(!isSlotMark(eventName.split(':')[1]) &&
		!eventName.includes('googletagInit'));

// measures that we want to save as commercial metrics, ones related to slots and googletagInitDuration
const shouldSaveMeasure = (measureName: string) =>
	trackedSlots.includes(measureName.split(':')[0] as TrackedSlots);

class EventTimer {
	private _events: Map<string, PerformanceEntry>;

	private _measures: Map<string, PerformanceMeasure>;

	properties: EventTimerProperties;
	/**
	 * Initialise the EventTimer class on page.
	 * Returns the singleton instance of the EventTimer class and binds
	 * to window.guardian.commercialTimer. If it's been previously
	 * initialised and bound it returns the original instance
	 * Note: We save to window.guardian.commercialTimer because
	 * different bundles (DCR / DCP) can use commercial core, and we want
	 * all timer events saved to a single instance per-page
	 * @returns {EventTimer} Instance of EventTimer
	 */
	static init(): EventTimer {
		return (window.guardian.commercialTimer ||= new EventTimer());
	}

	/**
	 * Just a helper method to access the singleton instance of EventTimer.
	 * Typical use case is EventTimer.get().trigger
	 */
	static get(): EventTimer {
		return this.init();
	}

	/**
	 * External events are events that are not triggered by the commercial but we are interested in
	 * tracking their performance. For example, CMP-related events.
	 **/
	get externalEvents(): Map<ExternalEvents, PerformanceEntry> {
		const externalEvents = new Map();

		for (const event of Object.values(ExternalEvents)) {
			if (window.performance.getEntriesByName(event).length) {
				externalEvents.set(
					event,
					window.performance.getEntriesByName(event)[0],
				);
			}
		}
		return externalEvents;
	}

	/**
	 * Returns all performance marks and measures that should be saved as commercial metrics.
	 */
	public get events() {
		return [...this._events, ...this.externalEvents].map(
			([name, timer]) => ({
				name,
				ts: timer.startTime,
			}),
		);
	}

	/**
	 * Returns all performance measures that should be saved as commercial metrics.
	 */
	public get measures() {
		return [...this._measures].map(([name, measure]) => ({
			name,
			duration: measure.duration,
		}));
	}

	private constructor() {
		this._events = new Map();
		this._measures = new Map();

		this.properties = {};

		if (window.navigator.connection) {
			this.properties.type = window.navigator.connection.type;
			this.properties.downlink = window.navigator.connection.downlink;
			this.properties.effectiveType =
				window.navigator.connection.effectiveType;
		}
	}

	/**
	 * Adds a non timer measurement
	 *
	 * @param {string} name - the property's name
	 * @param value - the property's value
	 */
	setProperty<T extends keyof EventTimerProperties>(
		name: T,
		value: EventTimerProperties[T],
	): void {
		this.properties[name] = value;
	}

	/**
	 * Creates a new performance mark
	 * For slot events also ensures each TYPE of event event is only logged once per slot
	 *
	 * @param eventName The short name applied to the mark
	 * @param origin - Either 'page' (default) or the name of the slot
	 */
	trigger(eventName: string, origin = 'page'): void {
		let name = eventName;
		if (isSlotMark(eventName) && origin !== 'page') {
			name = `${origin}:${name}`;
		}

		if (this._events.get(name) || !supportsPerformanceAPI()) {
			return;
		}

		const mark = window.performance.mark(name);

		if (
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- browser support is patchy
			typeof mark?.startTime === 'number' &&
			// we only want to save the marks that are related to certain slots or the page
			shouldSaveMark(name)
		) {
			this._events.set(name, mark);
		}

		if (name.endsWith('End')) {
			this.measure(name);
		}
	}

	private measure(endEvent: string): void {
		const startEvent = endEvent.replace('End', 'Start');
		const measureName = endEvent.replace('End', 'Duration');
		const startMarkExists =
			window.performance.getEntriesByName(startEvent).length > 0;
		if (startMarkExists) {
			try {
				const measure = window.performance.measure(
					measureName,
					startEvent,
					endEvent,
				);

				// we only want to save the measures that are related to certain slots or the page
				if (shouldSaveMeasure(measureName)) {
					this._measures.set(measureName, measure);
				}
			} catch (e) {
				log('commercial', `error measuring ${measureName}`, e);
			}
		}
	}
}

export { EventTimer };

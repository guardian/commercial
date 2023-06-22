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

enum PageEvents {
	CommercialStart = 'commercialStart',
	GoogletagInitStart = 'googletagInitStart',
	GoogletagInitEnd = 'googletagInitEnd',
	LabsContainerInView = 'labsContainerInView',
}

enum SlotEvents {
	AdOnPage = 'adOnPage',
	AdRenderStart = 'adRenderStart',
	DefineSlotStart = 'defineAdSlotStart',
	DefineSlotEnd = 'defineAdSlotEnd',
	PrebidStart = 'prebidStart',
	PrebidEnd = 'prebidEnd',
	LoadAdStart = 'loadAdStart',
	LoadAdEnd = 'loadAdEnd',
	AdRenderEnd = 'adRenderEnd',
}

enum ExternalEvents {
	CmpInit = 'cmp-init',
	CmpUiDisplayed = 'cmp-ui-displayed',
	CmpGotConsent = 'cmp-got-consent',
}

type CommercialEvents = Map<string, PerformanceEntry>;

const isSlotMark = (eventName: string): eventName is SlotEvents =>
	Object.values(SlotEvents).includes(eventName as SlotEvents);

const shouldSaveMark = (eventName: string) =>
	(isSlotMark(eventName) && eventName.split(':')[1] === 'adOnPage') ||
	eventName === PageEvents.CommercialStart;

const shouldSaveMeasure = (measureName: string) =>
	trackedSlots.includes(measureName.split(':')[0] as TrackedSlots) ||
	measureName === 'googletagInitDuration';

class EventTimer {
	private _events: CommercialEvents;

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
	 * Returns all commercial timers. CMP-related timers are not tracked
	 * by EventTimer so they need to be concatenated to EventTimer's private events array.
	 */
	public get events() {
		return [...this._events, ...this.externalEvents].map(
			([name, timer]) => ({
				name,
				ts: timer.startTime,
			}),
		);
	}

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
	 * For slot events also ensures each TYPE of event event is marked only once for 'first'
	 * (the first time that event is triggered for ANY slot) and once for topAboveNav
	 *
	 * @param {string} eventName - The short name applied to the mark
	 * @param {origin} [origin=page] - Either 'page' (default) or the name of the slot
	 */
	trigger(eventName: string, origin?: string): void {
		if (isSlotMark(eventName) && origin) {
			this.mark(`${origin}:${eventName}`);
		} else {
			this.mark(eventName);
		}
	}

	private mark(name: string): void {
		if (this._events.get(name) || !supportsPerformanceAPI()) {
			return;
		}

		const mark = window.performance.mark(name);

		if (
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- browser support is patchy
			typeof mark?.startTime === 'number' &&
			// we only want to save the marks related to certain slots or the page
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

				if (shouldSaveMeasure(measureName)) {
					this._measures.set(measureName, measure);
				}
			} catch (e) {
				log('commercial', `error measuring ${measureName}`, e);
			}
		}
	}
}

export { EventTimer, PageEvents, SlotEvents, type CommercialEvents };

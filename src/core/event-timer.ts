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

// const trackedSlots = [
// 	'top-above-nav',
// 	'inline1',
// 	// 'inline2',
// ] as const;

// type TrackedSlots = typeof trackedSlots[number];

enum PageEvents {
	CommercialStart = 'commercialStart',
	CommercialExtraModulesLoaded = 'commercialExtraModulesLoaded',
	CommercialBaseModulesLoaded = 'commercialBaseModulesLoaded',
	CommercialModulesLoaded = 'commercialModulesLoaded',
	LabsContainerInView = 'labsContainerInView',
	// CommercialStart = 'commercialStart',
	// GoogletagInitStart = 'googletagInitStart',
	// GoogletagInitEnd = 'googletagInitEnd',
}

const enum SlotEvents {
	PrebidStart = 'prebidStart',
	PrebidEnd = 'prebidEnd',
	SlotInitialised = 'slotInitialised',
	SlotReady = 'slotReady',
	AdOnPage = 'adOnPage',
	// AdRenderStart = 'adRenderStart',
	// DefineAdSlotsStart = 'defineAdSlotsStart',
	// DefineAdSlotsEnd = 'defineAdSlotsEnd',
	// PrebidStart = 'prebidStart',
	// PrebidAuctionStart = 'prebidAuctionStart',
	// PrebidAuctionEnd = 'prebidAuctionEnd',
	// PrebidEnd = 'prebidEnd',
	// LoadAdStart = 'loadAdStart',
	// LoadAdEnd = 'loadAdEnd',
	// AdRenderEnd = 'adRenderEnd',
}

enum ExternalEvents {
	CmpInit = 'cmp-init',
	CmpUiDisplayed = 'cmp-ui-displayed',
	CmpGotConsent = 'cmp-got-consent',
}

type EventName = `${string}-${SlotEvents}` | `${PageEvents}`;

type CommercialEvents = Map<EventName | ExternalEvents, PerformanceEntry>;

type LongEventName = `gu.commercial.${EventName}`;

const isGlobalEvent = (
	eventName: PageEvents | SlotEvents,
): eventName is PageEvents =>
	Object.values(PageEvents).includes(eventName as PageEvents);

class EventTimer {
	private _events: CommercialEvents;

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

	private get externalEvents(): Map<ExternalEvents, PerformanceEntry> {
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
		return new Map([...this._events, ...this.externalEvents]);
	}

	private constructor() {
		this._events = new Map();

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
	trigger(eventName: PageEvents | SlotEvents, origin?: string): void {
		if (isGlobalEvent(eventName)) {
			this.mark(eventName);
		} else if (origin) {
			this.mark(`${origin}-${eventName}`);
		}
	}

	private mark(name: PageEvents | `${string}-${SlotEvents}`): void {
		const longName: LongEventName = `gu.commercial.${name}`;
		if (!this._events.get(name) && supportsPerformanceAPI()) {
			const mark = window.performance.mark(longName);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- browser support is patchy
			if (typeof mark?.startTime === 'number') {
				this._events.set(name, mark);
			}
		}
	}
}

export { EventTimer, PageEvents, SlotEvents, type CommercialEvents };

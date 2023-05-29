import { trackEvent } from './google-analytics';
import type { ConnectionType } from './types';

class Event {
	name: string;
	ts: DOMHighResTimeStamp;

	constructor(name: string, mark: PerformanceEntry) {
		this.name = name;
		this.ts = mark.startTime;
	}
}
interface GALogEvent {
	timingVariable: string;
	timingLabel?: string;
}

interface GAConfig {
	logEvents: GALogEvent[];
}

interface SlotEventStatus {
	prebidStart: boolean;
	prebidEnd: boolean;
	slotInitialised: boolean;
	slotReady: boolean;
	adOnPage: boolean;
}

interface PageEventStatus {
	commercialStart: boolean;
	commercialExtraModulesLoaded: boolean;
	commercialBaseModulesLoaded: boolean;
	commercialModulesLoaded: boolean;
}

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

class EventTimer {
	private _events: Event[];
	private static _externallyDefinedEventNames = [
		'cmp-init',
		'cmp-ui-displayed',
		'cmp-got-consent',
	];
	startTS: DOMHighResTimeStamp;
	triggers: {
		first: SlotEventStatus;
		'top-above-nav': SlotEventStatus;
		page: PageEventStatus;
	};
	gaConfig: GAConfig;
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
	 * Returns all commercial timers. CMP-related timers are not tracked
	 * by EventTimer so they need to be concatenated to EventTimer's private events array.
	 */
	public get events(): Event[] {
		return typeof window.performance !== 'undefined' &&
			'getEntriesByName' in window.performance
			? [
					...this._events,
					...EventTimer._externallyDefinedEventNames
						.map((eventName) => {
							const entry =
								window.performance.getEntriesByName(
									eventName,
								)[0];
							// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- possibly undefined
							return entry
								? new Event(eventName, entry)
								: undefined;
						})
						.filter(
							(entry): entry is Event => entry instanceof Event,
						),
			  ]
			: this._events;
	}

	private constructor() {
		this._events = [];
		this.startTS = window.performance.now();
		this.triggers = {
			first: {
				slotReady: false,
				prebidStart: false,
				prebidEnd: false,
				slotInitialised: false,
				adOnPage: false,
			},
			'top-above-nav': {
				slotReady: false,
				prebidStart: false,
				prebidEnd: false,
				slotInitialised: false,
				adOnPage: false,
			},
			page: {
				commercialStart: false,
				commercialExtraModulesLoaded: false,
				commercialBaseModulesLoaded: false,
				commercialModulesLoaded: false,
			},
		};

		this.gaConfig = {
			logEvents: [
				{
					timingVariable: 'slotReady',
				},
				{
					timingVariable: 'slotInitialised',
				},
				{
					timingVariable: 'commercialStart',
					timingLabel: 'Commercial start parse time',
				},
				{
					timingVariable: 'commercialModulesLoaded',
					timingLabel: 'Commercial end parse time',
				},
			],
		};

		this.properties = {};

		if (window.navigator.connection) {
			this.properties.type = window.navigator.connection.type;
			this.properties.downlink = window.navigator.connection.downlink;
			this.properties.effectiveType =
				window.navigator.connection.effectiveType;
		}
	}

	/**
	 * Adds an event timer property
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
	trigger(eventName: string, origin = 'page'): void {
		const TRACKED_SLOT_NAME = 'top-above-nav';
		if (
			origin === 'page' &&
			!this.triggers.page[eventName as keyof PageEventStatus]
		) {
			this.mark(eventName);
			this.trackInGA(eventName);
			this.triggers.page[eventName as keyof PageEventStatus] = true;
			return;
		}

		if (!this.triggers.first[eventName as keyof SlotEventStatus]) {
			const trackLabel = `first-${eventName}`;
			this.mark(trackLabel);
			this.trackInGA(eventName, trackLabel);
			this.triggers.first[eventName as keyof SlotEventStatus] = true;
		}

		if (origin === TRACKED_SLOT_NAME) {
			if (
				!this.triggers[TRACKED_SLOT_NAME][
					eventName as keyof SlotEventStatus
				]
			) {
				const trackLabel = `${TRACKED_SLOT_NAME}-${eventName}`;
				this.mark(trackLabel);
				this.trackInGA(eventName, trackLabel);
				this.triggers[TRACKED_SLOT_NAME][
					eventName as keyof SlotEventStatus
				] = true;
			}
		}
	}

	private mark(name: string): void {
		const longName = `gu.commercial.${name}`;
		if (
			typeof window.performance !== 'undefined' &&
			'mark' in window.performance &&
			typeof window.performance.mark === 'function'
		) {
			const mark = window.performance.mark(longName);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- browser support is patchy
			if (typeof mark?.startTime === 'number') {
				this._events.push(new Event(name, mark));
			}
		}
	}

	private trackInGA(eventName: string, label = ''): void {
		const gaEvent = this.gaConfig.logEvents.find(
			(e) => e.timingVariable === eventName,
		);
		if (gaEvent) {
			const labelToUse = gaEvent.timingLabel ?? label;
			trackEvent('Commercial Events', gaEvent.timingVariable, labelToUse);
		}
	}
}

export { EventTimer };

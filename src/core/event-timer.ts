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
	/** the height of the page / the viewport height  */
	pageHeightVH?: number;
	gpcSignal?: number;
	/** distance in percentage of viewport height at which ads are lazy loaded */
	lazyLoadMarginPercent?: number;
	hasLabsContainer?: boolean;
	labsUrl?: string;
	/** Record whether we've detected an ad blocker. This is intentionally
	 * distinct from the property we pass into commercial metrics, and in the
	 * future _could_ be removed in favour of this property */
	detectedAdBlocker?: boolean;
	/** creative ID of a video interscroller for video reporting metrics */
	videoInterscrollerCreativeId?: number | null | undefined;
	/** percentage progress of video interscroller on page unload */
	videoInterscrollerPercentageProgress?: number;
}

// Events will be logged using the performance API for all slots, but only these slots will be tracked as commercial metrics and sent to the data lake
const trackedSlots = [
	'top-above-nav',
	'inline1',
	'inline2',
	'fronts-banner-1',
	'fronts-banner-2',
] as const;

type TrackedSlot = (typeof trackedSlots)[number];

// marks that we want to save as commercial metrics
const slotMarks = [
	'slotReady',
	'adRenderStart',
	'prebidStart',
	'adOnPage',
	'viewable',
] as const;

type SlotMark = (typeof slotMarks)[number];

// measures that we want to save as commercial metrics
const slotMeasures = [
	'adRender',
	'defineSlot',
	'prepareSlot',
	'prebid',
	'fetchAd',
] as const;

type SlotMeasure = (typeof slotMeasures)[number];

const pageMarks = ['commercialStart', 'commercialModulesLoaded'] as const;

type PageMark = (typeof pageMarks)[number];

// measures that we want to save as commercial metrics
const pageMeasures = ['commercialBoot', 'googletagInit'] as const;

type PageMeasure = (typeof pageMeasures)[number];

// all marks, including the measure start and end marks
const allSlotMarks = [
	...slotMarks,
	...slotMeasures.map((measure) => `${measure}Start`),
	...slotMeasures.map((measure) => `${measure}End`),
] as const;

const externalMarks = [
	'cmp-init',
	'cmp-ui-displayed',
	'cmp-got-consent',
] as const;

type ExternalMark = (typeof externalMarks)[number];

const shouldSave = (name: string): boolean => {
	let [origin, type] = name.split('_') as [string, string | undefined];
	if (!type) {
		type = origin;
		origin = 'page';
	}

	const shouldSaveMark =
		(trackedSlots.includes(origin as TrackedSlot) &&
			slotMarks.includes(type as SlotMark)) ||
		(origin === 'page' && pageMarks.includes(type as PageMark));

	const shouldSaveMeasure =
		(trackedSlots.includes(origin as TrackedSlot) &&
			slotMeasures.includes(type as SlotMeasure)) ||
		(origin === 'page' && pageMeasures.includes(type as PageMeasure));

	return shouldSaveMark || shouldSaveMeasure;
};

class EventTimer {
	private _marks: Map<string, PerformanceEntry>;

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
	 * These are marks that are not triggered by commercial but we are interested in
	 * tracking their performance. For example, CMP-related events.
	 **/
	private get _externalMarks(): Map<ExternalMark, PerformanceEntry> {
		if (!supportsPerformanceAPI()) {
			return new Map();
		}

		return externalMarks.reduce((map, mark) => {
			const entries = window.performance.getEntriesByName(mark);
			if (entries.length && entries[0]) {
				map.set(mark, entries[0]);
			}
			return map;
		}, new Map<ExternalMark, PerformanceEntry>());
	}

	/**
	 * Returns all performance marks that should be saved as commercial metrics.
	 */
	public get marks() {
		return [...this._marks, ...this._externalMarks].map(
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
		this._marks = new Map();
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
	 * Creates a new performance mark, and if the mark ends with 'End' it will
	 * create a performance measure between the start and end marks.
	 *
	 * Marks can  be triggered multiple times, but we only save the first
	 * instance of a mark, as things like ad refreshes can trigger the same mark.
	 *
	 * More info on the performance API:
	 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
	 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
	 *
	 * @todo more strict typing for eventName and origin
	 * @param eventName The short name applied to the mark
	 * @param origin - Either 'page' (default) or the name of the slot
	 */
	mark(eventName: string, origin = 'page'): void {
		let name = eventName;
		if (allSlotMarks.includes(eventName) && origin !== 'page') {
			name = `${origin}_${name}`;
		}

		if (this._marks.get(name) || !supportsPerformanceAPI()) {
			return;
		}

		const mark = window.performance.mark(name);

		if (
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- browser support is patchy
			typeof mark?.startTime === 'number' &&
			// we only want to save the marks that are related to certain slots or the page
			shouldSave(name)
		) {
			this._marks.set(name, mark);
		}

		if (name.endsWith('End')) {
			this.measure(name);
		}
	}

	/**
	 * Creates a performance measure given the name of the end marks.
	 * The start mark is inferred from the end mark.
	 *
	 * @param endMark - The name of the mark that ends the measure
	 **/
	private measure(endMark: string): void {
		const startMark = endMark.replace('End', 'Start');
		const measureName = endMark.replace('End', '');
		const startMarkExists =
			window.performance.getEntriesByName(startMark).length > 0;
		if (startMarkExists) {
			try {
				const measure = window.performance.measure(
					measureName,
					startMark,
					endMark,
				);

				// we only want to save the measures that are related to certain slots or the page
				if (measure && shouldSave(measureName)) {
					this._measures.set(measureName, measure);
				}
			} catch (e) {
				log('commercial', `error measuring ${measureName}`, e);
			}
		}
	}
}

const _ = {
	slotMarks,
	slotMeasures,
	trackedSlots,
};

export { EventTimer, _, supportsPerformanceAPI };

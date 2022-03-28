import { trackEvent } from './google-analytics';

// Set parameters to be used in tests
const PERFORMANCE_NOW = 1;
const TIMING_CATEGORY = 'TIMING_CATEGORY';
const TIMING_VAR = 'TIMING_VAR';
const TIMING_LABEL = 'TIMING_LABEL';
const GUARDIAN_CONFIG = {
	googleAnalytics: {
		trackers: {
			editorial: 'gaTrackerTest',
		},
	},
};

const ga = jest.fn();

describe('trackEvent', () => {
	beforeEach(() => {
		window.performance.now = () => PERFORMANCE_NOW;
	});

	it('trackEvent makes no call to ga when ga undefined', () => {
		window.guardian = {
			config: GUARDIAN_CONFIG,
		};
		Object.defineProperty(window, 'ga', {
			configurable: true,
			enumerable: true,
			value: undefined,
			writable: true,
		});
		trackEvent(TIMING_CATEGORY, TIMING_VAR, TIMING_LABEL);
		expect(ga.mock.calls.length).toBe(0);
	});

	it('trackEvent makes one call to ga with tracker name from config', () => {
		window.guardian = {
			config: GUARDIAN_CONFIG,
		};
		Object.defineProperty(window, 'ga', {
			configurable: true,
			enumerable: true,
			value: ga,
			writable: true,
		});
		trackEvent(TIMING_CATEGORY, TIMING_VAR, TIMING_LABEL);
		expect(ga.mock.calls.length).toBe(1);
		expect(ga.mock.calls).toEqual([
			[
				'gaTrackerTest.send',
				'timing',
				TIMING_CATEGORY,
				TIMING_VAR,
				PERFORMANCE_NOW,
				TIMING_LABEL,
			],
		]);
	});
	it('trackEvent makes one call to ga with default tracker name when config undefined', () => {
		window.guardian = {
			config: undefined,
		};
		Object.defineProperty(window, 'ga', {
			configurable: true,
			enumerable: true,
			value: ga,
			writable: true,
		});
		trackEvent(TIMING_CATEGORY, TIMING_VAR, TIMING_LABEL);
		expect(ga.mock.calls.length).toBe(1);
		expect(ga.mock.calls).toEqual([
			[
				'send',
				'timing',
				TIMING_CATEGORY,
				TIMING_VAR,
				PERFORMANCE_NOW,
				TIMING_LABEL,
			],
		]);
	});
});

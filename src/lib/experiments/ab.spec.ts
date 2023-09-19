import type { ABTest, Runnable } from '@guardian/ab-core';
import type { Config } from 'types/global';
import { _ } from '../analytics/mvt-cookie';
import type { concurrentTests as concurrentTestsMock } from './__mocks__/ab-tests';
import {
	getAsyncTestsToRun,
	getSynchronousTestsToRun,
	isInVariantSynchronous,
	runAndTrackAbTests,
} from './ab';
import { NOT_IN_TEST } from './ab-constants';
import {
	getParticipationsFromLocalStorage,
	setParticipationsInLocalStorage,
} from './ab-local-storage';
import { concurrentTests as _concurrentTests } from './ab-tests';
import { runnableTestsToParticipations } from './ab-utils';

const { overwriteMvtCookie } = _;

const concurrentTests = _concurrentTests as typeof concurrentTestsMock;

// This is required as loading these seems to cause an error locally (and in CI)
// because of some implicit dependency evil that I haven't been able to figure out.
jest.mock('lib/user-features', () => ({
	getLastOneOffContributionDate: () => null,
	isRecurringContributor: () => false,
	shouldNotBeShownSupportMessaging: () => false,
}));

function emptyFunction() {
	// do nothing
}

jest.mock('lib/experiments/ab-tests'); // __mocks__/ab-tests
jest.mock('lib/experiments/ab-ophan', () => ({
	registerImpressionEvents: emptyFunction,
	registerCompleteEvents: emptyFunction,
	trackABTests: emptyFunction,
	buildOphanPayload: emptyFunction,
}));
jest.mock(
	'lodash-es/memoize',
	() =>
		<T>(f: (...args: unknown[]) => T) =>
			f,
);

const cfg: DeepPartial<Config> = window.guardian.config;

describe('A/B', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		cfg.page = {};
		cfg.page.isSensitive = false;
		cfg.switches = {
			abDummyTest: true,
		};
		overwriteMvtCookie(1234);
		window.location.hash = '';
		setParticipationsInLocalStorage({});
	});

	afterEach(() => {
		delete cfg.page;
		delete cfg.switches;
	});

	describe('runAndTrackAbTests', () => {
		test('should run all concurrent tests whose canRun is true, but just the first epic test & first banner test', () => {
			cfg.switches = {
				abDummyTest: true,
				abDummyTest2: true,
				abDummyTest3CanRunIsFalse: true,
				abEpicTest: true,
				abEpicTest2: true,
				abBannerTest: true,
				abBannerTest2: true,
			};

			const shouldRun = [
				// @ts-expect-error -- this is mocked in __mocks__/ab-tests.ts
				jest.spyOn(concurrentTests[0].variants[0], 'test'),
				// @ts-expect-error -- this is mocked in __mocks__/ab-tests.ts
				jest.spyOn(concurrentTests[1].variants[0], 'test'),
			];

			const shouldNotRun = [
				// @ts-expect-error -- this is mocked in __mocks__/ab-tests.ts
				jest.spyOn(concurrentTests[2].variants[0], 'test'),
			];

			expect.assertions(shouldRun.length + shouldNotRun.length);

			return runAndTrackAbTests().then(() => {
				shouldRun.forEach((spy) => expect(spy).toHaveBeenCalled());
				shouldNotRun.forEach((spy) =>
					expect(spy).not.toHaveBeenCalled(),
				);
			});
		});

		test('renamed/deleted tests should be removed from localStorage', () => {
			expect.assertions(1);

			setParticipationsInLocalStorage({
				noTestSwitchForThisOne: { variant: 'Control' },
			});

			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
				});
			});
		});

		test('tests with notintest participations should not run, but this should be persisted to localStorage', () => {
			expect.assertions(3);

			// @ts-expect-error -- this is mocked in __mocks__/ab-tests.ts
			const spy = jest.spyOn(concurrentTests[0].variants[0], 'test');
			expect(spy).not.toHaveBeenCalled();
			setParticipationsInLocalStorage({
				DummyTest: { variant: NOT_IN_TEST },
			});

			return runAndTrackAbTests().then(() => {
				expect(spy).not.toHaveBeenCalled();
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: NOT_IN_TEST },
				});
			});
		});

		test('URL participations for non-existent variants that are not notintest should not be persisted to localStorage', () => {
			expect.assertions(1);

			window.location.hash = '#ab-DummyTest=bad_variant';

			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
				});
			});
		});

		test('URL participations for tests which cannot be run on this pageview should not be persisted to localStorage', () => {
			expect.assertions(1);

			cfg.switches = {
				abDummyTest: true,
				abDummyTest2: true,
				abDummyTest3CanRunIsFalse: true,
			};
			window.location.hash = '#ab-DummyTest3CanRunIsFalse=control';

			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
					DummyTest2: { variant: 'control' },
				});
			});
		});

		test('URL participations for variants which cannot be run should not be preserved in localStorage', () => {
			expect.assertions(1);

			cfg.switches = {
				abDummyTest: true,
				abDummyTest4ControlCanRunIsFalse: true,
			};
			window.location.hash = '#ab-DummyTest4ControlCanRunIsFalse=control';

			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
				});
			});
		});

		test('URL participations for tests which can be run on this pageview should be persisted to localStorage', () => {
			expect.assertions(2);

			window.location.hash = '#ab-DummyTest=variant';
			// @ts-expect-error -- this is mocked in __mocks__/ab-tests.ts
			expect(getSynchronousTestsToRun()[0].variantToRun.id).toEqual(
				'variant',
			);

			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'variant' },
				});
			});
		});

		test('localStorage participations for non-existent variants that are not notintest should not be preserved in localStorage', () => {
			setParticipationsInLocalStorage({
				DummyTest: { variant: 'bad_variant' },
			});

			expect.assertions(1);
			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
				});
			});
		});

		test('localStorage participations for tests which cannot be run should not be preserved in localStorage', () => {
			cfg.switches = {
				abDummyTest: true,
				abDummyTest2: true,
				abDummyTest3CanRunIsFalse: true,
			};

			setParticipationsInLocalStorage({
				DummyTest3CanRunIsFalse: { variant: 'bad_variant' },
			});

			expect.assertions(1);
			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
					DummyTest2: { variant: 'control' },
				});
			});
		});

		test('localStorage participations for variants which cannot be run should not be preserved in localStorage', () => {
			cfg.switches = {
				abDummyTest: true,
				abDummyTest4ControlCanRunIsFalse: true,
			};

			setParticipationsInLocalStorage({
				DummyTest4ControlCanRunIsFalse: { variant: 'control' },
			});

			expect.assertions(1);
			return runAndTrackAbTests().then(() => {
				expect(getParticipationsFromLocalStorage()).toEqual({
					DummyTest: { variant: 'control' },
				});
			});
		});
	});

	describe('getTestsToRun', () => {
		// Note that memoize has been mocked to just call the function each time!
		// Otherwise this test would be a bit pointless
		test('should give the same result whether called before or after runAndTrackAbTests', () => {
			expect.assertions(2);

			cfg.switches = {
				abDummyTest: true,
				abDummyTest2: true,
				abEpicTest: true,
			};
			setParticipationsInLocalStorage({
				// this should be overriden by URL
				DummyTest: { variant: 'control' },

				// this should be respected (overriding the control, which would be the cookie-determined variant)
				DummyTest2: { variant: 'variant' },

				// this should be ignored & deleted
				NoTestSwitchForThisOne: { variant: 'blah' },

				// ...and we should get an EpicTest added
			});
			window.location.hash = '#ab-DummyTest=variant';

			const expectedSynchronousTestsToRun = {
				DummyTest: { variant: 'variant' },
				DummyTest2: { variant: 'variant' },
			};

			const expectedTestsToRun = {
				...expectedSynchronousTestsToRun,
			};

			const checkTests = (tests: ReadonlyArray<Runnable<ABTest>>) =>
				expect(runnableTestsToParticipations(tests)).toEqual(
					expectedTestsToRun,
				);

			return getAsyncTestsToRun()
				.then((asyncTests) =>
					checkTests([...asyncTests, ...getSynchronousTestsToRun()]),
				)
				.then(runAndTrackAbTests)
				.then(getAsyncTestsToRun)
				.then((asyncTests) =>
					checkTests([...asyncTests, ...getSynchronousTestsToRun()]),
				);
		});
	});

	describe('isInVariantSynchronous', () => {
		test('should respect the URL hash', () => {
			window.location.hash = '#ab-DummyTest=variant';
			expect(
				isInVariantSynchronous(concurrentTests[0], 'variant'),
			).toEqual(true);
		});

		test('should respect localStorage and MVT cookie', () => {
			cfg.switches = {
				abDummyTest: true,
				abDummyTest2: true,
			};
			setParticipationsInLocalStorage({
				DummyTest: { variant: 'variant' },
			});

			expect(
				isInVariantSynchronous(concurrentTests[0], 'variant'),
			).toEqual(true);

			expect(
				isInVariantSynchronous(concurrentTests[1], 'control'),
			).toEqual(true);

			expect(
				isInVariantSynchronous(concurrentTests[2], 'variant'),
			).toEqual(false);

			expect(
				isInVariantSynchronous(concurrentTests[1], 'variant'),
			).toEqual(false);
		});
	});
});

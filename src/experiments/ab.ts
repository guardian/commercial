import type { ABTest } from '@guardian/ab-core';
import { AB } from '@guardian/ab-core';
import { getCookie, log } from '@guardian/libs';
import {
	getParticipationsFromLocalStorage,
	setParticipationsInLocalStorage,
} from '../lib/ab-localstorage';
import { concurrentTests } from './ab-tests';
import { getForcedParticipationsFromUrl } from './ab-url';

const mvtMinValue = 1;
const mvtMaxValue = 1_000_000;

/** Parse a valid MVT ID between 1 and 1,000,000 or undefined if it fails */
const parseMvtId = (id: string | null): number | undefined => {
	if (!id) return; // null or empty string
	const number = Number(id);
	if (Number.isNaN(number)) return;
	if (number < mvtMinValue) return;
	if (number > mvtMaxValue) return;
	return number;
};

const getMvtId = (): number | undefined =>
	parseMvtId(
		getCookie({
			name: 'GU_mvt_id',
			shouldMemoize: true,
		}),
	);

type OphanRecordFunction = (
	event: Record<string, unknown> & {
		/**
		 * the experiences key will override previously set values.
		 * Use `recordExperiences` instead.
		 */
		experiences?: never;
	},
	callback?: () => void,
) => void;
/**
 * Store a reference to Ophan so that we don't need to load/enhance it more than once.
 */
let cachedOphan: typeof window.guardian.ophan;

const getOphan = () => {
	const { ophan } = window.guardian;

	const record: OphanRecordFunction = (event, callback) => {
		ophan.record(event, callback);
		log('commercial', '🧿 Ophan event recorded:', event);
	};

	const trackComponentAttention: typeof ophan.trackComponentAttention = (
		name,
		el,
		visibilityThreshold,
	) => {
		ophan.trackComponentAttention(name, el, visibilityThreshold);
		log('commercial', '🧿 Ophan tracking component attention:', name, {
			el,
			visibilityThreshold,
		});
	};

	cachedOphan = { ...ophan, record, trackComponentAttention };
	return cachedOphan;
};

const mvtId = getMvtId();
const abTestSwitches = Object.entries(window.guardian.config.switches).reduce(
	(prev, [key, val]) => ({ ...prev, [key]: val }),
	{},
);

const init = () => {
	const forcedTestVariants = {
		...getParticipationsFromLocalStorage(),
		...getForcedParticipationsFromUrl(),
	};

	setParticipationsInLocalStorage(forcedTestVariants);

	const ab = new AB({
		mvtId: mvtId ?? -1,
		mvtMaxValue,
		pageIsSensitive: window.guardian.config.page.isSensitive,
		abTestSwitches,
		arrayOfTestObjects: concurrentTests,
		forcedTestVariants,
		ophanRecord: getOphan().record,
		serverSideTests: window.guardian.config.tests ?? {},
		errorReporter: (error) => {
			console.log('AB tests error:', error);
		},
	});

	const allRunnableTests = ab.allRunnableTests(concurrentTests);
	ab.trackABTests(allRunnableTests);
	ab.registerImpressionEvents(allRunnableTests);
	ab.registerCompleteEvents(allRunnableTests);
	log('commercial', 'AB tests initialised');

	return ab;
};

export const getParticipations = () => {
	const ab = init();
	const runnableTests = ab.allRunnableTests(concurrentTests);

	const participations = runnableTests.reduce<
		Record<string, { variant: string }>
	>((acc, test) => {
		acc[test.id] = { variant: test.variantToRun.id };
		return acc;
	}, {});

	return participations;
};

export const isUserInVariant = (test: ABTest, variantId: string): boolean => {
	const ab = init();
	return ab.isUserInVariant(test.id, variantId);
};

export const getVariant = (test: ABTest): string | undefined => {
	const participations = getParticipations();

	return participations[test.id]?.variant;
};

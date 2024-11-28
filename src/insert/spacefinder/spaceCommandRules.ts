import { once } from 'lodash-es';
import { getMvtId } from '../../experiments/ab';
import type { OpponentSelectorRules, SpacefinderRules } from './spacefinder';

type Rule = {
	id: string;
	selector: string;
	minAbove: number;
	minBelow: number;
};

type Ruleset = {
	id: string;
	name: string;
	enabled: boolean;
	viewportId: string;
	rules: Rule[];
	abTestId?: string;
	abTestVariantId?: string;
};

interface ABTestVariant {
	id: string;
	name: string;
	description: string;
	weight: number;
}

interface ABTest {
	id: string;
	name: string;
	description: string;
	status: 'draft' | 'active' | 'completed';
	variants: ABTestVariant[];
	startDate?: string;
	endDate?: string;
}

const bodySelector = '.article-body-commercial-selector';

let abTests: ABTest[] = [];

void (async () => {
	const response = await fetch('http://localhost:5173/api/ab-tests');
	abTests = ((await response.json()) as { tests: ABTest[] }).tests.filter(
		(test) => test.status === 'active',
	);
})();

const mvtMaxValue = 1_000_000;
const smallestMvtId = 1;
const largestMvtId = mvtMaxValue;

const getVariant = (testId: string): ABTestVariant | null => {
	const test = abTests.find((test) => test.id === testId);

	if (!test) {
		console.error(`Test ${testId} not found`);
		return null;
	}

	const mvtId = getMvtId();

	if (mvtId && mvtId >= smallestMvtId && mvtId <= largestMvtId) {
		return test.variants[mvtId % test.variants.length] ?? null;
	}

	return null;
};

const isInABTestVariant = (testId: string, variantId: string): boolean => {
	const variant = getVariant(testId);
	const isInVariant = variant?.id === variantId;

	console.log(
		`User is in variant ${variantId} of test ${testId}: ${isInVariant}`,
	);

	return isInVariant;
};

// only fetch rules once per page view
const fetchRules = once(async () => {
	const rulesetResponse = await fetch('http://localhost:5173/api/rules');

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- it's a bit late to bother fixing this rn
	return (await rulesetResponse.json()).ruleSets as Ruleset[];
});

const desktopInline1Rules = async (): Promise<SpacefinderRules> => {
	const rulesJson = await fetchRules();
	const desktopRulesets = rulesJson
		.filter(({ viewportId }) => viewportId === 'desktop')
		.filter(({ abTestId, abTestVariantId }) => {
			if (!abTestId || !abTestVariantId) {
				return true;
			}

			return isInABTestVariant(abTestId, abTestVariantId);
		});

	const candidateSelector =
		':scope > p, [data-spacefinder-role="nested"] > p';
	const isImmersive = window.guardian.config.page.isImmersive;

	let selectorList = {};

	desktopRulesets
		.map(({ rules }) => rules)
		.flat()
		.forEach((rule) => {
			const { selector, minAbove, minBelow } = rule;

			const newSelector: OpponentSelectorRules = {
				[`:scope > [data-spacefinder-role="${selector}"]`]: {
					marginBottom: minAbove,
					marginTop: minBelow,
				},
			};

			selectorList = { ...selectorList, ...newSelector };
		});

	console.log('desktopInline1 selectorList', selectorList);

	return {
		bodySelector,
		candidateSelector,
		minDistanceFromTop: isImmersive ? 700 : 300,
		minDistanceFromBottom: 300,
		opponentSelectorRules: selectorList,
	};
};

const mobileAndTabletRules = async (): Promise<SpacefinderRules> => {
	const rulesJson = await fetchRules();
	const mobileAndTabletRulesets = rulesJson
		.filter(({ viewportId }) => viewportId === 'mobile')
		.filter(({ abTestId, abTestVariantId }) => {
			if (!abTestId || !abTestVariantId) {
				return true;
			}

			return isInABTestVariant(abTestId, abTestVariantId);
		});

	const mobileCandidateSelector =
		':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p';

	let selectorList = {};

	mobileAndTabletRulesets
		.map(({ rules }) => rules)
		.flat()
		.forEach((rule) => {
			const { selector, minAbove, minBelow } = rule;

			const newSelector: OpponentSelectorRules = {
				[`:scope > [data-spacefinder-role="${selector}"]`]: {
					marginBottom: minAbove,
					marginTop: minBelow,
				},
			};

			selectorList = { ...selectorList, ...newSelector };
		});

	console.log('mobileAndTabletRules selectorList', selectorList);

	return {
		bodySelector,
		candidateSelector: mobileCandidateSelector,
		minDistanceFromTop: 200,
		minDistanceFromBottom: 200,
		opponentSelectorRules: selectorList,
		/**
		 * Filter out any candidates that are too close to the last winner
		 * see https://github.com/guardian/commercial/tree/main/docs/spacefinder#avoiding-other-winning-candidates
		 * for more information
		 **/
		filter: (candidate, lastWinner) => {
			if (!lastWinner) {
				return true;
			}
			const distanceBetweenAds = candidate.top - lastWinner.top;
			return distanceBetweenAds >= 750;
		},
	};
};

export { desktopInline1Rules, mobileAndTabletRules };

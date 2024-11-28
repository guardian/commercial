import { once } from 'lodash-es';
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
};

const bodySelector = '.article-body-commercial-selector';

// only fetch rules once per page view
const fetchRules = once(async () => {
	const rulesetResponse = await fetch('http://localhost:5173/api/rules');

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- it's a bit late to bother fixing this rn
	return (await rulesetResponse.json()).ruleSets as Ruleset[];
});

const desktopInline1Rules = async (): Promise<SpacefinderRules> => {
	const rulesJson = await fetchRules();
	const desktopRuleset = rulesJson.find(
		({ viewportId }) => viewportId === 'desktop',
	);

	const candidateSelector =
		':scope > p, [data-spacefinder-role="nested"] > p';
	const isImmersive = window.guardian.config.page.isImmersive;

	let selectorList = {};

	desktopRuleset?.rules.forEach((rule) => {
		const { selector, minAbove, minBelow } = rule;

		const newSelector: OpponentSelectorRules = {
			[`:scope > [data-spacefinder-role="${selector}"]`]: {
				marginBottom: minAbove,
				marginTop: minBelow,
			},
		};

		selectorList = { ...selectorList, ...newSelector };
	});

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
	const mobileAndTabletRuleset = rulesJson.find(
		({ viewportId }) => viewportId === 'mobile',
	);

	const mobileCandidateSelector =
		':scope > p, :scope > h2, :scope > [data-spacefinder-type$="NumberedTitleBlockElement"], [data-spacefinder-role="nested"] > p';

	let selectorList = {};

	mobileAndTabletRuleset?.rules.forEach((rule) => {
		const { selector, minAbove, minBelow } = rule;

		const newSelector: OpponentSelectorRules = {
			[`:scope > [data-spacefinder-role="${selector}"]`]: {
				marginBottom: minAbove,
				marginTop: minBelow,
			},
		};

		selectorList = { ...selectorList, ...newSelector };
	});

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

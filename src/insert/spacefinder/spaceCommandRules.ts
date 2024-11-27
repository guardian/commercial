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

const desktopInline1Rules = async (): Promise<SpacefinderRules> => {
	const rulesetResponse = await fetch('http://localhost:5173/api/rules');

	console.log(`COMMAND DEBUGGING ${String(rulesetResponse)}`);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- it's a bit late to bother fixing this rn
	const rulesJson = (await rulesetResponse.json()).ruleSets as Ruleset[];

	console.log(rulesJson);

	const desktopRuleset = rulesJson.find(
		({ viewportId }) => viewportId === 'desktop',
	);

	const bodySelector = '.article-body-commercial-selector';
	const candidateSelector =
		':scope > p, [data-spacefinder-role="nested"] > p';
	const isImmersive = window.guardian.config.page.isImmersive;

	let selectorList = {};

	desktopRuleset?.rules.forEach((rule) => {
		const { selector, minAbove, minBelow } = rule;

		const newSelector: OpponentSelectorRules = {
			[`:scope > ${selector}`]: {
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

export { desktopInline1Rules };

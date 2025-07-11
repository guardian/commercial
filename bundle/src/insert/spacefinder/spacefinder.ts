// total_hours_spent_maintaining_this = 81.5

import { log } from '@guardian/libs';
import { memoize } from 'lodash-es';
import fastdom from '../../lib/fastdom-promise';
import { getUrlVars } from '../../lib/url';

type RuleSpacing = {
	/**
	 * Don't place an ad closer than this to the bottom of the opponent
	 */
	marginBottom: number;
	/**
	 * Don't place an ad closer than this to the top of the opponent
	 */
	marginTop: number;
	bypassMinTop?: string;
};

type SpacefinderMetaItem = {
	required?: number;
	actual?: number;
	element: HTMLElement;
};

type SpacefinderItem = {
	top: number;
	bottom: number;
	element: HTMLElement;
	meta: {
		tooClose: SpacefinderMetaItem[];
		overlaps: SpacefinderMetaItem[];
	};
};

type OpponentSelectorRules = Record<string, RuleSpacing>;

type SpacefinderRules = {
	bodySelector: string;
	body?: HTMLElement | Document;
	/**
	 * Selector(s) for the elements that we want to allow inserting ads above
	 */
	candidateSelector: string;
	/**
	 * Minimum distance from slot to top of page
	 */
	absoluteMinDistanceFromTop?: number;
	/**
	 * Minimum distance from paragraph to top of article
	 */
	minDistanceFromTop: number;
	/**
	 * Minimum distance from (top of) paragraph to bottom of article
	 */
	minDistanceFromBottom: number;
	/**
	 * Vertical px to clear the content meta element (byline etc) by. 0 to ignore.
	 * used for carrot ads
	 */
	clearContentMeta?: number;
	/**
	 * This is a map of selectors to rules. Each selector will be used to find opponents
	 * which are elements that we want to avoid placing ads too close to. If the opponent
	 * is too close to a candidate by the specified marginTop or marginBottom, the
	 * candidate will be excluded.
	 */
	opponentSelectorRules?: OpponentSelectorRules;
	/**
	 * Will run each slot through this fn to check if it must be counted in
	 */
	filter?: (x: SpacefinderItem, lastWinner?: SpacefinderItem) => boolean;
	/**
	 * Will remove slots before this one
	 */
	startAt?: HTMLElement;
	/**
	 * Will remove slots from this one on
	 */
	stopAt?: HTMLElement;
	/**
	 * Will reverse the order of slots (this is useful for lazy loaded content)
	 */
	fromBottom?: boolean;
};

type SpacefinderWriter = (paras: HTMLElement[]) => Promise<void>;

type SpacefinderPass =
	| 'inline1'
	| 'subsequent-inlines'
	| 'mobile-inlines'
	| 'carrot';

type SpacefinderOptions = {
	waitForImages?: boolean;
	waitForInteractives?: boolean;
	pass: SpacefinderPass;
};

type ExcludedItem = SpacefinderItem | HTMLElement;

type SpacefinderExclusions = Record<string, ExcludedItem[]>;

type ElementDimensionMap = Record<string, SpacefinderItem[]>;

type Measurements = {
	bodyTop: number;
	bodyHeight: number;
	candidates: SpacefinderItem[];
	contentMeta?: SpacefinderItem;
	opponents?: ElementDimensionMap;
};

const query = (selector: string, context?: HTMLElement | Document) => [
	...(context ?? document).querySelectorAll<HTMLElement>(selector),
];

/** maximum time (in ms) to wait for images to be loaded */
const LOADING_TIMEOUT = 5_000;

const defaultOptions: SpacefinderOptions = {
	waitForImages: true,
	waitForInteractives: false,
	pass: 'inline1',
};

const isIframe = (node: Node): node is HTMLIFrameElement =>
	node instanceof HTMLIFrameElement;

const isIframeLoaded = (iframe: HTMLIFrameElement) => {
	try {
		return iframe.contentWindow?.document.readyState === 'complete';
	} catch (err) {
		return true;
	}
};

const getFuncId = (rules: SpacefinderRules) => rules.bodySelector || 'document';

const isImage = (element: HTMLElement): element is HTMLImageElement =>
	element instanceof HTMLImageElement;

const onImagesLoaded = memoize((rules: SpacefinderRules) => {
	const notLoaded = query('img', rules.body)
		.filter(isImage)
		.filter((img) => !img.complete && img.loading !== 'lazy');

	const imgPromises = notLoaded.map(
		(img) =>
			new Promise((resolve) => {
				img.addEventListener('load', resolve);
			}),
	);
	return Promise.all(imgPromises).then(() => Promise.resolve());
}, getFuncId);

const waitForSetHeightMessage = (
	iframe: HTMLIFrameElement,
	callback: () => void,
) => {
	window.addEventListener('message', (event) => {
		if (event.source !== iframe.contentWindow) return;

		try {
			const message = JSON.parse(event.data) as Record<
				string,
				string | number
			>;

			if (message.type === 'set-height' && Number(message.value) > 0) {
				callback();
			}
		} catch (ex) {
			log('commercial', 'Unparsable message sent from iframe', ex);
		}
	});
};

const onInteractivesLoaded = memoize(async (rules: SpacefinderRules) => {
	const notLoaded = query('.element-interactive', rules.body).filter(
		(interactive) => {
			const iframes = Array.from(interactive.children).filter(isIframe);
			return !(iframes[0] && isIframeLoaded(iframes[0]));
		},
	);

	if (notLoaded.length === 0 || !('MutationObserver' in window)) {
		return Promise.resolve();
	}

	const mutations = notLoaded.map(
		(interactive) =>
			new Promise<void>((resolve) => {
				// Listen for when iframes are added as children to interactives
				new MutationObserver((records, instance) => {
					if (
						!records[0]?.addedNodes[0] ||
						!isIframe(records[0]?.addedNodes[0])
					) {
						return;
					}

					const iframe = records[0].addedNodes[0];

					// Listen for when the iframes are resized
					// This is a sign they have fully loaded and spacefinder can proceed
					waitForSetHeightMessage(iframe, () => {
						instance.disconnect();
						resolve();
					});
				}).observe(interactive, {
					childList: true,
				});
			}),
	);
	await Promise.all(mutations);
}, getFuncId);

const partitionCandidates = <T>(
	list: T[],
	filterElement: (element: T, lastFilteredElement: T | undefined) => boolean,
): [T[], T[]] => {
	const filtered: T[] = [];
	const exclusions: T[] = [];

	list.forEach((element) => {
		if (filterElement(element, filtered[filtered.length - 1])) {
			filtered.push(element);
		} else {
			exclusions.push(element);
		}
	});

	return [filtered, exclusions];
};

/**
 * Check if the top of the candidate is far enough from the opponent
 *
 * The candidate is the element where we would like to insert an ad above. Candidates satisfy the `selector` rule.
 *
 * Opponents are other elements in the article that are in the spacefinder ruleset
 * for the current pass. This includes slots inserted by a previous pass but not
 * those in the current pass as they're all inserted at the end.
 *
 *                                                        │
 *                     Opponent Below                     │             Opponent Above
 *                                                        │
 *                  ───────────────────  Top of container │          ───────────────────  Top of container
 *                    ▲              ▲                    │            ▲              ▲
 *                    │              │                    │            │              │ opponent.top
 *                    │ ┌──────────┐ │                    │            │ ┌──────────┐ ▼   (insertion point)
 *                    │ │          │ |candidate.bottom    │            │ │          │
 *                    │ │ Candidate│ │                    │            │ │ Opponent |
 *       opponent.top │ │          │ │                    candidate.top│ │          │
 *                    │ └──────────┘ ▼                    │            │ └──────────┘
 *                    │                                   │            │           ▲
 *                    │ ────────────                      │            │           │ marginBottom
 *                    │           ▲                       │            │           ▼
 *                    │           │ marginTop             │            │  ───────────
 *                    │           ▼                       │            │
 * (insertion point)  ▼ ┌──────────┐                      │            ▼ ┌──────────┐
 *                      │          │                      │              │          │
 *                      │ Opponent |                      │              │ Candidate│
 *                      │          │                      │              │          │
 *                      └──────────┘                      │              └──────────┘
 *                                                        │
 *                                                        │
 */
const isTopOfCandidateFarEnoughFromOpponent = (
	candidate: SpacefinderItem,
	opponent: SpacefinderItem,
	rule: RuleSpacing,
	isOpponentBelow: boolean,
): boolean => {
	const potentialInsertPosition = candidate.top;

	if (isOpponentBelow && rule.marginTop) {
		if (rule.bypassMinTop && candidate.element.matches(rule.bypassMinTop)) {
			return true;
		}
		return opponent.top - potentialInsertPosition >= rule.marginTop;
	}

	if (!isOpponentBelow && rule.marginBottom) {
		return potentialInsertPosition - opponent.bottom >= rule.marginBottom;
	}

	// if no rule is set (or they're 0), return true
	return true;
};

/**
 * Check if 1 - the candidate is the same as the opponent or 2- if the opponent contains the candidate
 *
 * 1 can happen when the candidate and opponent selectors overlap
 * 2 can happen when there are nested candidates, it may try t avoid it's own ancestor
 */
const bypassTestCandidate = (
	candidate: SpacefinderItem,
	opponent: SpacefinderItem,
) =>
	candidate.element === opponent.element ||
	opponent.element.contains(candidate.element);

// test one element vs another for the given rules
const testCandidate = (
	rule: RuleSpacing,
	candidate: SpacefinderItem,
	opponent: SpacefinderItem,
): boolean => {
	if (bypassTestCandidate(candidate, opponent)) {
		return true;
	}

	const isOpponentBelow =
		opponent.bottom > candidate.bottom && opponent.top >= candidate.bottom;
	const isOpponentAbove =
		opponent.top < candidate.top && opponent.bottom <= candidate.top;

	// this can happen when the an opponent like an image or interactive is floated right
	const opponentOverlaps =
		(isOpponentAbove && isOpponentBelow) ||
		(!isOpponentAbove && !isOpponentBelow);

	const pass =
		!opponentOverlaps &&
		isTopOfCandidateFarEnoughFromOpponent(
			candidate,
			opponent,
			rule,
			isOpponentBelow,
		);

	if (!pass) {
		if (opponentOverlaps) {
			candidate.meta.overlaps.push({
				element: opponent.element,
			});
		} else {
			// if the test fails, add debug information to the candidate metadata
			const required = isOpponentBelow
				? rule.marginTop
				: rule.marginBottom;
			const actual = isOpponentBelow
				? opponent.top - candidate.top
				: candidate.top - opponent.bottom;

			candidate.meta.tooClose.push({
				required,
				actual,
				element: opponent.element,
			});
		}
	}

	return pass;
};

// test one element vs an array of other elements for the given rule
const testCandidates = (
	rule: RuleSpacing,
	candidate: SpacefinderItem,
	opponents: SpacefinderItem[],
): boolean =>
	opponents
		.map((opponent) => testCandidate(rule, candidate, opponent))
		.every(Boolean);

const enforceRules = (
	measurements: Measurements,
	rules: SpacefinderRules,
	spacefinderExclusions: SpacefinderExclusions,
) => {
	let candidates = measurements.candidates;

	// enforce absoluteMinDistanceFromTop rule
	let [filtered, exclusions] = partitionCandidates(
		candidates,
		(candidate) =>
			!rules.absoluteMinDistanceFromTop ||
			candidate.top + measurements.bodyTop >=
				rules.absoluteMinDistanceFromTop,
	);
	spacefinderExclusions.absoluteMinDistanceFromTop = exclusions;
	candidates = filtered;

	// enforce minAbove and minBelow rules
	[filtered, exclusions] = partitionCandidates(candidates, (candidate) => {
		const farEnoughFromTopOfBody =
			candidate.top >= rules.minDistanceFromTop;
		const farEnoughFromBottomOfBody =
			candidate.top + rules.minDistanceFromBottom <=
			measurements.bodyHeight;
		return farEnoughFromTopOfBody && farEnoughFromBottomOfBody;
	});
	spacefinderExclusions.aboveAndBelow = exclusions;
	candidates = filtered;

	// enforce content meta rule
	const { clearContentMeta } = rules;
	if (clearContentMeta) {
		[filtered, exclusions] = partitionCandidates(
			candidates,
			(candidate) =>
				!!measurements.contentMeta &&
				candidate.top >
					measurements.contentMeta.bottom + clearContentMeta,
		);
		spacefinderExclusions.contentMeta = exclusions;
		candidates = filtered;
	}

	// enforce selector rules
	if (rules.opponentSelectorRules) {
		const selectorExclusions: SpacefinderItem[] = [];
		for (const [selector, rule] of Object.entries(
			rules.opponentSelectorRules,
		)) {
			[filtered, exclusions] = partitionCandidates(
				candidates,
				(candidate) =>
					testCandidates(
						rule,
						candidate,
						measurements.opponents?.[selector] ?? [],
					),
			);
			spacefinderExclusions[selector] = exclusions;
			selectorExclusions.push(...exclusions);
		}

		candidates = candidates.filter(
			(candidate) => !selectorExclusions.includes(candidate),
		);
	}

	if (rules.filter) {
		[filtered, exclusions] = partitionCandidates(candidates, rules.filter);
		spacefinderExclusions.custom = exclusions;
		candidates = filtered;
	}

	return candidates;
};

class SpaceError extends Error {
	constructor(rules: SpacefinderRules) {
		super();
		this.name = 'SpaceError';
		this.message = `There is no space left matching rules from ${rules.bodySelector}`;
	}
}
/**
 * Wait for the page to be ready (images loaded, interactives loaded)
 * or for LOADING_TIMEOUT to elapse, whichever comes first.
 * @param  {SpacefinderRules} rules
 * @param  {SpacefinderOptions} options
 */
const getReady = (rules: SpacefinderRules, options: SpacefinderOptions) =>
	Promise.race([
		new Promise((resolve) =>
			window.setTimeout(() => resolve('timeout'), LOADING_TIMEOUT),
		),
		Promise.all([
			options.waitForImages ? onImagesLoaded(rules) : Promise.resolve(),
			options.waitForInteractives
				? onInteractivesLoaded(rules)
				: Promise.resolve(),
		]),
	]).then((value) => {
		if (value === 'timeout') {
			log('commercial', 'Spacefinder timeout hit');
		}
	});

const getCandidates = (
	rules: SpacefinderRules,
	spacefinderExclusions: SpacefinderExclusions,
) => {
	let candidates = query(rules.candidateSelector, rules.body);

	if (rules.fromBottom) {
		candidates.reverse();
	}
	if (rules.startAt) {
		let drop = true;
		const [filtered, exclusions] = partitionCandidates(
			candidates,
			(candidate) => {
				if (candidate === rules.startAt) {
					drop = false;
				}
				return !drop;
			},
		);
		spacefinderExclusions.startAt = exclusions;
		candidates = filtered;
	}
	if (rules.stopAt) {
		let keep = true;
		const [filtered, exclusions] = partitionCandidates(
			candidates,
			(candidate) => {
				if (candidate === rules.stopAt) {
					keep = false;
				}
				return keep;
			},
		);
		spacefinderExclusions.stopAt = exclusions;
		candidates = filtered;
	}
	return candidates;
};

const getDimensions = (element: HTMLElement): Readonly<SpacefinderItem> =>
	Object.freeze({
		top: element.offsetTop,
		bottom: element.offsetTop + element.offsetHeight,
		element,
		meta: {
			tooClose: [],
			overlaps: [],
		},
	});

const getMeasurements = (
	rules: SpacefinderRules,
	candidates: HTMLElement[],
): Promise<Measurements> => {
	const contentMeta = rules.clearContentMeta
		? (document.querySelector<HTMLElement>('.js-content-meta') ?? undefined)
		: undefined;
	const opponents = rules.opponentSelectorRules
		? Object.keys(rules.opponentSelectorRules).map(
				(selector) => [selector, query(selector, rules.body)] as const,
			)
		: [];

	return fastdom.measure((): Measurements => {
		let bodyDistanceToTopOfPage = 0;
		let bodyHeight = 0;
		if (rules.body instanceof Element) {
			const bodyElement = rules.body.getBoundingClientRect();
			// bodyElement is relative to the viewport, so we need to add scroll position to get the distance
			bodyDistanceToTopOfPage = bodyElement.top + window.scrollY;
			bodyHeight = bodyElement.height;
		}
		const candidatesWithDims = candidates.map(getDimensions);
		const contentMetaWithDims =
			rules.clearContentMeta && contentMeta
				? getDimensions(contentMeta)
				: undefined;
		const opponentsWithDims = opponents.reduce<
			Record<string, SpacefinderItem[]>
		>((result, [selector, selectedElements]) => {
			result[selector] = selectedElements.map(getDimensions);
			return result;
		}, {});

		return {
			bodyTop: bodyDistanceToTopOfPage,
			bodyHeight,
			candidates: candidatesWithDims,
			contentMeta: contentMetaWithDims,
			opponents: opponentsWithDims,
		};
	});
};

// Rather than calling this directly, use spaceFiller to inject content into the page.
// SpaceFiller will safely queue up all the various asynchronous DOM actions to avoid any race conditions.
const findSpace = async (
	rules: SpacefinderRules,
	options?: SpacefinderOptions,
	exclusions: SpacefinderExclusions = {},
): Promise<HTMLElement[]> => {
	options = { ...defaultOptions, ...options };
	rules.body = rules.bodySelector
		? (document.querySelector<HTMLElement>(rules.bodySelector) ?? document)
		: document;

	window.performance.mark('commercial:spacefinder:findSpace:start');

	await getReady(rules, options);

	const candidates = getCandidates(rules, exclusions);
	const measurements = await getMeasurements(rules, candidates);
	const winners = enforceRules(measurements, rules, exclusions);

	const enableDebug = !!getUrlVars().sfdebug;

	if (enableDebug) {
		const pass = options.pass;
		void import('./spacefinder-debug-tools').then(({ init }) => {
			init(exclusions, winners, rules, pass);
		});
	}

	window.performance.mark('commercial:spacefinder:findSpace:end');

	const measure = window.performance.measure(
		'commercial:spacefinder:findSpace',
		'commercial:spacefinder:findSpace:start',
		'commercial:spacefinder:findSpace:end',
	);

	log(
		'commercial',
		`Spacefinder took ${Math.round(measure?.duration ?? 0)}ms for '${
			options.pass
		}' pass`,
		{
			rules,
			options,
		},
	);

	// TODO Is this really an error condition?
	if (!winners.length) {
		throw new SpaceError(rules);
	}

	return winners.map((candidate) => candidate.element);
};

export { findSpace, SpaceError };

export type {
	RuleSpacing,
	OpponentSelectorRules,
	SpacefinderRules,
	SpacefinderWriter,
	SpacefinderOptions,
	SpacefinderItem,
	SpacefinderExclusions,
	SpacefinderPass,
	SpacefinderMetaItem,
};

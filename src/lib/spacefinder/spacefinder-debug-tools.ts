import { log } from '@guardian/libs';
import { getUrlVars } from 'lib/utils/url';
import type {
	SpacefinderExclusions,
	SpacefinderItem,
	SpacefinderPass,
	SpacefinderRules,
} from './spacefinder';
import logo from './spacefinder-logo.svg';

const enableDebug = !!getUrlVars().sfdebug;

const isCurrentPass = (pass: SpacefinderPass) => {
	const sfdebugPass = document.querySelector<HTMLInputElement>(
		'input[name="sfdebug-pass"]:checked',
	)?.value;

	return sfdebugPass === pass;
};

const colours = {
	red: 'rgb(255 178 178)',
	darkRed: 'rgb(200 0 0)',
	orange: 'rgb(255 213 178)',
	darkOrange: 'rgb(255 128 0)',
	yellow: 'rgb(254 255 178)',
	blue: 'rgb(178 248 255)',
	purple: 'rgb(178 178 255)',
	green: 'rgb(178 255 184)',
};

const exclusionTypes = {
	absoluteMinAbove: {
		colour: colours.red,
		reason: 'Too close to the top of page',
	},
	aboveAndBelow: {
		colour: colours.orange,
		reason: 'Too close to top or bottom of article',
	},
	isStartAt: {
		colour: colours.purple,
		reason: 'Spacefinder is starting from this position',
	},
	startAt: {
		colour: colours.orange,
		reason: 'Before the starting element',
	},
	custom: {
		colour: colours.yellow,
		reason: 'Too close to other winner',
	},
	winner: {
		colour: colours.green,
		reason: 'Winner',
	},
	tooClose: {
		colour: colours.blue,
		reason: 'Too close to other element',
	},
} as const;

const isExclusionType = (type: string): type is keyof typeof exclusionTypes =>
	type in exclusionTypes;

const addOverlay = (element: HTMLElement, text: string) => {
	const overlay = document.createElement('div');
	overlay.className = 'overlay';
	overlay.appendChild(document.createTextNode(text));
	element.before(overlay);
};

const addHoverListener = (
	candidate: HTMLElement,
	tooClose: Exclude<SpacefinderItem['meta'], undefined>['tooClose'],
	pass: SpacefinderPass,
) => {
	tooClose.forEach((opponent) => {
		candidate.addEventListener('mouseenter', () => {
			if (!isCurrentPass(pass)) return false;

			if (!document.body.contains(opponent.element)) {
				// The element blocking the candidate has been removed from the DOM
				// since spacefinder ran. This means we aren't able to highlight it
				// as usual, but we can still provide some details in the console
				addOverlay(
					candidate,
					`Blocking element(s) removed from DOM: see console for details`,
				);

				log(
					'commercial',
					`Spacefinder: blocking element removed from DOM.\nCandidate:`,
					candidate,
					`\nBlocking element:`,
					opponent.element,
				);

				return;
			}

			opponent.element.classList.add('blocking-element');
			addOverlay(
				opponent.element,
				`${opponent.actual}px/${opponent.required}px`,
			);
		});

		candidate.addEventListener('mouseleave', () => {
			opponent.element.classList.remove('blocking-element');
			document.querySelectorAll('.overlay').forEach((el) => el.remove());
		});
	});
};

const annotateWinners = (winners: SpacefinderItem[], pass: SpacefinderPass) => {
	winners.forEach((winner) => {
		winner.element.setAttribute(`data-sfdebug-${pass}`, 'winner');
		winner.element.classList.add('candidate');
	});
};

const annotateExclusions = (
	exclusions: SpacefinderExclusions,
	rules: SpacefinderRules,
	pass: SpacefinderPass,
) => {
	for (const [key, arr] of Object.entries(exclusions)) {
		arr.forEach((exclusion) => {
			const element =
				exclusion instanceof Element ? exclusion : exclusion.element;

			const meta = exclusion instanceof Element ? null : exclusion.meta;

			const type = isExclusionType(key) && exclusionTypes[key];

			if (element == rules.startAt) {
				element.setAttribute(`data-sfdebug-${pass}`, 'isStartAt');
			} else if (type) {
				element.setAttribute(`data-sfdebug-${pass}`, key);
			} else if (meta && meta.tooClose.length > 0) {
				element.setAttribute(`data-sfdebug-${pass}`, 'tooClose');
				addHoverListener(element, meta.tooClose, pass);
			}

			element.classList.add('candidate');
		});
	}
};

const annotateBody = (rules: SpacefinderRules, pass: SpacefinderPass) => {
	const body = document.querySelector(rules.bodySelector) as HTMLElement;
	body.id = 'sfdebug-body';
	body.setAttribute(`data-sfdebug-min-above-${pass}`, `${rules.minAbove}px`);
};

const annotate = (
	exclusions: SpacefinderExclusions,
	winners: SpacefinderItem[],
	rules: SpacefinderRules,
	pass: SpacefinderPass,
): void => {
	try {
		annotateExclusions(exclusions, rules, pass);
		annotateWinners(winners, pass);
		annotateBody(rules, pass);
	} catch (e) {
		console.error('SFDebug Error', e);
	}
};

const renderLine = (pass: SpacefinderPass): void => {
	const body = document.getElementById('sfdebug-body');
	if (!body) return;

	const minAbove = body.getAttribute(`data-sfdebug-min-above-${pass}`);
	if (!minAbove) return;

	let line: HTMLElement | null = document.querySelector('.line');

	// Create line if it doesn't already exist
	if (!line) {
		line = document.createElement('div');
		line.className = 'line';

		body.appendChild(line);
	}

	// Update line
	line.innerHTML = `<div class='label'>Ads below here (${minAbove})</div>`;
	line.style.top = minAbove;
};

const renderCandidates = (pass: SpacefinderPass): void => {
	const candidates = document.querySelectorAll('.candidate');
	candidates.forEach((candidate) => {
		if (!(candidate instanceof HTMLElement)) return;

		const key = candidate.getAttribute(`data-sfdebug-${pass}`) ?? '';

		if (isExclusionType(key)) {
			const type = exclusionTypes[key];

			candidate.dataset.reason = type.reason;
			candidate.style.backgroundColor = type.colour;
		}
	});
};

const render = (pass: SpacefinderPass): void => {
	renderLine(pass);
	renderCandidates(pass);
};

const addPassToDebugPanel = (pass: SpacefinderPass): void => {
	const controls = document.querySelector('#sfdebug-panel .controls');
	if (!controls) return;

	// Create radio button
	const input = document.createElement('input');
	input.type = 'radio';
	input.id = `sfdebug-${pass}`;
	input.name = 'sfdebug-pass';
	input.value = pass;

	// Create label
	const label = document.createElement('label');
	label.htmlFor = `sfdebug-${pass}`;
	label.innerText = pass;

	// Setup listener
	input.addEventListener('change', (e) => {
		const pass = (e.target as HTMLInputElement).value as SpacefinderPass;
		render(pass);
	});

	controls.appendChild(input);
	controls.appendChild(label);
};

const addDebugPanel = (): void => {
	// Return if panel already initialised
	if (document.querySelector('#sfdebug-panel')) return;

	const panel = document.createElement('div');
	panel.id = 'sfdebug-panel';
	panel.innerHTML = `
		<div class="logo">
			${logo}
			<div class="label">debug mode</div>
		</div>
		<div class="controls"></div>
	`;

	document.body.appendChild(panel);

	// Inject styles
	const style = document.createElement('style');

	style.innerHTML = `
		#sfdebug-panel {
			font-family: sans-serif;
			position: fixed;
			bottom: 0;
			right: 0;
			background-color: #ffffff;
			padding: 10px;
			border-radius: 10px 0 0 0;
			z-index: 9999999;
			padding: 5px;
			border-top: solid gray 2px;
			border-left: solid gray 2px;
			background: #f1f1f1;
			opacity: 0.9;
		}

		#sfdebug-panel .logo {
			height: 90px;
			width: 245px;
		}

		#sfdebug-panel .logo svg {
			height: 65px;
			width: 100%;
			padding: 5px;
			display: block;
		}

		#sfdebug-panel .logo .label {
			font-size: 17px;
			font-family: cursive;
			color: #c80000;
			position: relative;
			top: -5px;
			right: -134px;
			font-style: italic;
		}

		#sfdebug-panel .controls {
			display: flex;
			flex-direction: row;
			justify-content: center;
			padding: 0px 10px 5px 10px;
		}

		#sfdebug-panel .controls label {
			cursor: pointer;
			background-color: #454545;
			color: white;
			padding: 10px;
			border-radius: 3px;
			user-select: none;
			margin: 0 5px;
			transition: all .2s ease-out;
		}

		#sfdebug-panel .controls input:checked + label {
			background-color: rgb(0 128 0);
		}

		#sfdebug-panel .controls input {
			display: none;
		}

		#sfdebug-body {
			position: relative;
		}

		#sfdebug-body .overlay {
			position:absolute;
			right:0;
			background-color:${colours.red};
			padding:5px 5px 10px 20px;
			font-family: sans-serif;
			z-index:20;
		}

		#sfdebug-body .blocking-element {
			box-shadow: 0px 0px 0px 10px ${colours.red};
			z-index:10;
			position:relative;
			display:block;
		}

		#sfdebug-body .line {
			position: absolute;
			width: 100%;
			background-color: ${colours.darkOrange};
			height: 3px;
			transition: all .2s ease-out;
		}

		#sfdebug-body .line .label {
			position: absolute;
			top: -27px;
			left: 230px;
			font-family: sans-serif;
			font-size: 14px;
			background-color: white;
			padding: 5px 10px 5px 10px;
			border: 3px solid ${colours.darkOrange};
			border-radius: 5px 5px 0px 0px;
		}

		#sfdebug-body .candidate {
			transition: all .2s ease-out;
		}

		#sfdebug-body .candidate::before {
			content: attr(data-reason);
			position:absolute;
			right:0;
			background-color:#fffffff7;
			padding:10px;
			border-radius:0 0 0 10px;
			font-family: sans-serif;
			font-size: 17px;
			line-height: 1;
		}

		/* tiny fix for liveblogs */
		.js-liveblog-body .candidate::before {
			margin-top: -8px;
		}

		#sfdebug-body .ad-slot-container {
			outline: 4px solid ${colours.darkRed}
		}
		`;

	document.body.appendChild(style);
};

const init = (
	exclusions: SpacefinderExclusions = {},
	winners: SpacefinderItem[],
	rules: SpacefinderRules,
	pass: SpacefinderPass,
): void => {
	if (!enableDebug) return;

	addDebugPanel();
	annotate(exclusions, winners, rules, pass);
	addPassToDebugPanel(pass);
};

export { init };

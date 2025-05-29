import { isUndefined, log } from '@guardian/libs';

type OpinaryPollEventData = {
	poll: {
		dmpIntegration: boolean;
		pollId: string;
		type: string;
		header: string;
	};
	vote: {
		label: string;
		x: string;
		y: string;
		optionID: string;
		position: string;
		value: string;
		unit: string;
	};
};

const isOpinaryEvent = (
	e: MessageEvent,
): e is MessageEvent<OpinaryPollEventData> => {
	if (
		typeof e.data !== 'object' ||
		e.data === null ||
		!('type' in e.data) ||
		!('poll' in e.data)
	) {
		return false;
	}

	// Type assertion to let TypeScript know the structure
	const data = e.data as { type: string; poll: { dmpIntegration: boolean } };
	return data.type === 'opinary.vote' && data.poll.dmpIntegration;
};

const opinaryPollListener = (event: MessageEvent) => {
	if (
		isUndefined(window.permutive) ||
		isUndefined(window.permutive.track) ||
		!isOpinaryEvent(event)
	) {
		return;
	}

	const { poll, vote } = event.data;

	const surveyResponse = {
		survey: {
			id: poll.pollId,
			type: poll.type,
			solution: 'Opinary',
		},
		question: {
			text: poll.header,
		},
		answer: {
			text: vote.label,
			posX: vote.x || 0.0,
			posY: vote.y || 0.0,
			optionIdentifier: vote.optionID || '',
			optionPosition: vote.position || 0,
			rawValue: vote.value || 0.0,
			unit: vote.unit || '',
		},
	};

	log('commercial', surveyResponse);

	window.permutive.track('SurveyResponse', surveyResponse);
	log('commercial', 'Sent Opinary poll response to Permutive');
};

const initOpinaryPollListener = (): Promise<void> =>
	Promise.resolve(window.addEventListener('message', opinaryPollListener));

// Exports for testing only
export const _ = {
	isOpinaryEvent,
};

export { initOpinaryPollListener };

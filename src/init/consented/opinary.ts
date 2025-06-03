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
		x: number;
		y: number;
		optionID: string;
		position: number;
		value: number;
		unit: string;
	};
};

type SurveyResponse = {
	survey: {
		id: string;
		type: string;
		solution: string;
	};
	question: {
		text: string;
	};
	answer: {
		text: string;
		posX: number;
		posY: number;
		optionIdentifier: string;
		optionPosition: number;
		rawValue: number;
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

	/**
	 * IMPORTANT: Do not change the shape of this data before checking with Permutive!
	 * This is a Permutive custom event and is documented and specified manually in a schema
	 * @see https://support.permutive.com/hc/en-us/articles/10211335253660-Schema-Updates-for-the-Pageview-Event-Custom-Events
	 * for more information
	 */
	const surveyResponse: SurveyResponse = {
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

	window.permutive.track('SurveyResponse', surveyResponse);

	log(
		'commercial',
		`Sent survey response to Permutive for poll ID ${poll.pollId}`,
	);
	log('commercial', surveyResponse);
};

const initOpinaryPollListener = (): Promise<void> => {
	if (window.permutive?.track) {
		return Promise.resolve(
			window.addEventListener('message', opinaryPollListener),
		);
	}
	return Promise.resolve();
};

// Exports for testing only
export const _ = {
	isOpinaryEvent,
};

export { initOpinaryPollListener };

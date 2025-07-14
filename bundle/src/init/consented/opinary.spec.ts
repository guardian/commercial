import { _ } from './opinary';

describe('isOpinaryEvent', () => {
	it('returns true if shape matches expected Opinary poll event', () => {
		const event = {
			data: {
				type: 'opinary.vote',
				poll: { dmpIntegration: true },
			},
		} as MessageEvent;

		expect(_.isOpinaryEvent(event)).toBe(true);
	});

	it('returns false if data.poll does not match conditions', () => {
		const event = {
			data: {
				type: 'opinary.vote',
				poll: { dmpIntegration: false },
			},
		} as MessageEvent;

		expect(_.isOpinaryEvent(event)).toBe(false);
	});

	it('returns false if data.type does not match conditions', () => {
		const event = {
			data: {
				type: 'opinary.not.vote',
				poll: { dmpIntegration: true },
			},
		} as MessageEvent;

		expect(_.isOpinaryEvent(event)).toBe(false);
	});

	it('returns false if poll is not defined', () => {
		const event = {
			data: {
				type: 'opinary.not.vote',
			},
		} as MessageEvent;

		expect(_.isOpinaryEvent(event)).toBe(false);
	});

	it('returns false if data is null', () => {
		const event = {
			data: null,
		} as MessageEvent;

		expect(_.isOpinaryEvent(event)).toBe(false);
	});
});

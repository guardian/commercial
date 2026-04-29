import { globalAdEvents } from './global-ad-events';

describe('globalAdEvents', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('calls handler when a matching status event "rendered" is dispatched', () => {
		const handler = jest.fn();
		const subscription = globalAdEvents('rendered', handler);

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);

		expect(handler).toHaveBeenCalledTimes(1);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
		expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
		expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
			name: 'rendered',
			slotName: 'top-above-nav',
			status: true,
		});

		subscription.remove();
	});
	it('calls handler when a matching status and slotName is dispatched', () => {
		const handler = jest.fn();

		const subscription = globalAdEvents(
			'loading',
			handler,
			'top-above-nav',
		);

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'loading',
					status: true,
				},
			}),
		);

		expect(handler).toHaveBeenCalledTimes(1);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
		expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- test
		expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
			name: 'loading',
			slotName: 'top-above-nav',
			status: true,
		});

		subscription.remove();
	});
	it('calls handler multiple times for multiple matching events', () => {
		const handler = jest.fn();
		const subscription = globalAdEvents('rendered', handler);

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);
		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);

		expect(handler).toHaveBeenCalledTimes(2);
		subscription.remove();
	});
	it('calls handler multiple times for multiple status arguments', () => {
		const handler = jest.fn();

		const subscription = globalAdEvents(
			['rendered', 'loaded'],
			handler,
			'top-above-nav',
		);

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);
		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'loaded',
					status: true,
				},
			}),
		);

		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: {
					slotName: 'top-above-nav',
					name: 'loaded',
					status: true,
				},
			}),
		);
		subscription.remove();
	});

	it('calls handler only for matching status arguments', () => {
		const handler = jest.fn();
		const subscription = globalAdEvents(
			['rendered', 'loaded'],
			handler,
			'top-above-nav',
		);

		// Dispatch an event that should pass
		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);

		// Dispatch an event that should fail
		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'fetching',
					status: true,
				},
			}),
		);

		// Dispatch another event that should pass
		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'loaded',
					status: true,
				},
			}),
		);

		expect(handler).toHaveBeenCalledTimes(2);
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);
		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: {
					slotName: 'top-above-nav',
					name: 'loaded',
					status: true,
				},
			}),
		);
		subscription.remove();
	});

	it('does not call handler when event status "rendering" does not match subscription status "loading"', () => {
		const handler = jest.fn();

		const subscription = globalAdEvents('loading', handler);

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'inline1',
					name: 'rendering',
					status: true,
				},
			}),
		);

		expect(handler).not.toHaveBeenCalled();
		subscription.remove();
	});
	it('handler not called when slotName does not match', () => {
		const handler = jest.fn();

		const subscription = globalAdEvents('loading', handler, 'inline1');

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'loading',
					status: true,
				},
			}),
		);

		expect(handler).not.toHaveBeenCalled();
		subscription.remove();
	});
	it('handler not called when custom event name does not match', () => {
		const handler = jest.fn();

		const subscription = globalAdEvents(
			'loading',
			handler,
			'top-above-nav',
		);

		document.dispatchEvent(
			new CustomEvent('statusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'loading',
					status: true,
				},
			}),
		);
		expect(handler).not.toHaveBeenCalled();
		subscription.remove();
	});
	it('does not call handler after remove is called', () => {
		const handler = jest.fn();
		const subscription = globalAdEvents('rendered', handler);

		subscription.remove();

		document.dispatchEvent(
			new CustomEvent('commercial:adStatusChange', {
				detail: {
					slotName: 'top-above-nav',
					name: 'rendered',
					status: true,
				},
			}),
		);

		expect(handler).not.toHaveBeenCalled();
		subscription.remove();
	});
});

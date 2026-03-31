import { onAdEvent } from './global-ad-events';

const flushQueue = () => {
	const queue = window.guardian.commercial?.queue;
	if (Array.isArray(queue)) {
		queue.forEach((fn) => fn());
	}
};

describe('onAdEvent (global-ad-events)', () => {
	beforeEach(() => {
		window.guardian.commercial = {
			queue: [],
			onAdEvent: jest.fn().mockReturnValue({ remove: jest.fn() }),
		};
	});

	describe('queue interaction', () => {
		it('pushes exactly one thunk onto window.guardian.commercial.queue', () => {
			onAdEvent('rendered', jest.fn());

			expect(window.guardian.commercial?.queue).toHaveLength(1);
		});

		it('pushes one thunk per onAdEvent call', () => {
			onAdEvent('rendered', jest.fn());
			onAdEvent('loaded', jest.fn());

			expect(window.guardian.commercial?.queue).toHaveLength(2);
		});

		it('calls window.guardian.commercial.onAdEvent with (listenStatus, callback, { once }) when the thunk is executed', () => {
			const callback = jest.fn();
			onAdEvent('rendered', callback);

			flushQueue();

			expect(window.guardian.commercial?.onAdEvent).toHaveBeenCalledWith(
				'rendered',
				callback,
				{ once: false },
			);
		});

		it('does not pass an advertName argument — onAdEvent is called with exactly 3 arguments', () => {
			const callback = jest.fn();
			onAdEvent('rendered', callback);

			flushQueue();

			const callArgs = (
				window.guardian.commercial?.onAdEvent as jest.Mock
			).mock.calls[0] as unknown[];
			expect(callArgs).toHaveLength(3);
		});

		it('forwards once: true through to window.guardian.commercial.onAdEvent', () => {
			const callback = jest.fn();
			onAdEvent('rendered', callback, { once: true });

			flushQueue();

			expect(window.guardian.commercial?.onAdEvent).toHaveBeenCalledWith(
				'rendered',
				callback,
				{ once: true },
			);
		});

		it('supports an array of statuses', () => {
			const callback = jest.fn();
			onAdEvent(['loaded', 'rendered'], callback);

			flushQueue();

			expect(window.guardian.commercial?.onAdEvent).toHaveBeenCalledWith(
				['loaded', 'rendered'],
				callback,
				{ once: false },
			);
		});

		it('does not throw when window.guardian.commercial.onAdEvent is not yet available', () => {
			delete window.guardian.commercial!.onAdEvent;

			onAdEvent('rendered', jest.fn());

			expect(() => flushQueue()).not.toThrow();
		});
	});

	describe('remove()', () => {
		it('does not throw when called before the queue is flushed', () => {
			const listener = onAdEvent('rendered', jest.fn());

			expect(() => listener.remove()).not.toThrow();
		});

		it('does nothing when called before the queue is flushed (no inner listener yet)', () => {
			const mockOnAdEvent = window.guardian.commercial
				?.onAdEvent as jest.Mock;
			const listener = onAdEvent('rendered', jest.fn());

			listener.remove();

			// The thunk was never flushed so onAdEvent was never called
			expect(mockOnAdEvent).not.toHaveBeenCalled();
		});

		it('calls the inner AdvertListener.remove() when called after flushing', () => {
			const innerRemove = jest.fn();
			(
				window.guardian.commercial?.onAdEvent as jest.Mock
			).mockReturnValue({ remove: innerRemove });

			const listener = onAdEvent('rendered', jest.fn());
			flushQueue();

			listener.remove();

			expect(innerRemove).toHaveBeenCalled();
		});
	});
});

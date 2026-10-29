import { installOnDvtagReady } from './doubleverify-helper';

describe('installOnDvtagReady', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(1000);
		installOnDvtagReady();
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
		delete window.onDvtagReady;
		delete window.dvtag;
	});

	it('should create dvtag and its command queue when first called', () => {
		expect(window.onDvtagReady).toEqual(expect.any(Function));
		expect(window.dvtag).toBeUndefined();

		window.onDvtagReady?.(jest.fn());

		expect(window.dvtag?.cmd).toEqual([expect.any(Function)]);
	});

	it('should queue an ad request without replacing an existing dvtag', () => {
		const commands: Array<() => void> = [];
		const queueAdRequest = jest.fn();
		const dvtag = { cmd: commands, queueAdRequest };
		window.dvtag = dvtag;
		const callback = jest.fn();

		window.onDvtagReady?.(callback);
		expect(window.dvtag).toBe(dvtag);
		expect(queueAdRequest).not.toHaveBeenCalled();
		expect(callback).not.toHaveBeenCalled();

		commands[0]?.();

		expect(queueAdRequest).toHaveBeenCalledTimes(1);
		expect(queueAdRequest).toHaveBeenCalledWith({
			callback,
			timeout: 750,
			timestamp: 1000,
		});
	});

	it.each([
		[undefined, 750],
		[100, 100],
	])(
		'should call back after the timeout (%s) and clear the queued callback',
		(timeout, expectedDelay) => {
			const commands: Array<() => void> = [];
			const queueAdRequest = jest.fn();
			window.dvtag = { cmd: commands, queueAdRequest };
			const callback = jest.fn();

			window.onDvtagReady?.(callback, timeout);
			jest.advanceTimersByTime(expectedDelay - 1);
			expect(callback).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);
			expect(callback).toHaveBeenCalledTimes(1);

			commands[0]?.();
			expect(queueAdRequest).toHaveBeenCalledWith({
				callback: null,
				timeout: expectedDelay,
				timestamp: 1000,
			});
		},
	);

	it('should not call back again if DV has already consumed the callback', () => {
		const commands: Array<() => void> = [];
		window.dvtag = {
			cmd: commands,
			queueAdRequest: jest.fn(
				(options: { callback: (() => void) | null }) => {
					const callback = options.callback;
					options.callback = null;
					callback?.();
				},
			),
		};
		const callback = jest.fn();

		window.onDvtagReady?.(callback);
		commands[0]?.();
		expect(callback).toHaveBeenCalledTimes(1);

		jest.advanceTimersByTime(750);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should allow the timeout to expire without a callback', () => {
		window.onDvtagReady?.();

		expect(() => jest.advanceTimersByTime(750)).not.toThrow();
	});
});

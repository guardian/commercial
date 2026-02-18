import { createCommercialQueue } from './guardian-commercial-queue';

window.guardian.config.page.adUnit = 'adUnit';

describe('createCommercialQueue', () => {
	it('should buffer a function without executing it', () => {
		const queue = createCommercialQueue();
		const mockFn = jest.fn();
		queue.push(mockFn);
		expect(mockFn).not.toHaveBeenCalled();
	});

	it('should buffer multiple functions without executing them', () => {
		const queue = createCommercialQueue();
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const mockFn3 = jest.fn();
		queue.push(mockFn1, mockFn2, mockFn3);
		[mockFn1, mockFn2, mockFn3].forEach((fn) => {
			expect(fn).not.toHaveBeenCalled();
		});
	});

	it('flush method should execute all buffered functions in order', () => {
		const queue = createCommercialQueue();
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const mockFn3 = jest.fn();
		queue.push(mockFn1, mockFn2, mockFn3);
		queue.flush();

		expect(mockFn1.mock.invocationCallOrder[0]!).toBeLessThan(
			mockFn2.mock.invocationCallOrder[0]!,
		);
		expect(mockFn2.mock.invocationCallOrder[0]!).toBeLessThan(
			mockFn3.mock.invocationCallOrder[0]!,
		);
		[mockFn1, mockFn2, mockFn3].forEach((fn) => {
			expect(fn).toHaveBeenLastCalledWith();
		});
	});

	it('should handle flushing an empty queue gracefully', () => {
		const queue = createCommercialQueue();

		expect(() => queue.flush()).not.toThrow();
	});

	it('should buffer preloaded functions and execute them', () => {
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const queue = createCommercialQueue([mockFn1, mockFn2]);
		queue.flush();
		expect(mockFn1).toHaveBeenCalled();
		expect(mockFn2).toHaveBeenCalled();
	});

	it('should execute the preloaded functions in the correct order', () => {
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const queue = createCommercialQueue([mockFn1, mockFn2]);
		queue.flush();
		expect(mockFn1.mock.invocationCallOrder[0]!).toBeLessThan(
			mockFn2.mock.invocationCallOrder[0]!,
		);
	});

	it('should allow additional functions to be pushed and execute in the correct order', () => {
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const mockFn3 = jest.fn();
		const queue = createCommercialQueue([mockFn1, mockFn2]);

		queue.push(mockFn3);

		queue.flush();

		expect(mockFn1.mock.invocationCallOrder[0]!).toBeLessThan(
			mockFn2.mock.invocationCallOrder[0]!,
		);
		expect(mockFn2.mock.invocationCallOrder[0]!).toBeLessThan(
			mockFn3.mock.invocationCallOrder[0]!,
		);
	});

	it('should handle errors in preloaded functions and continue executing others', () => {
		const mockFn1 = jest.fn(() => {
			throw new Error('Test error');
		});
		const mockFn2 = jest.fn();
		const queue = createCommercialQueue([mockFn1, mockFn2]);

		queue.flush();

		// Verify that the first function throws an error but the second function is still executed
		expect(mockFn1).toHaveBeenCalledTimes(1);
		expect(mockFn2).toHaveBeenCalledTimes(1);
	});

	it('should not re-execute preloaded functions when flushed multiple times', () => {
		const mockFn1 = jest.fn();
		const mockFn2 = jest.fn();
		const queue = createCommercialQueue([mockFn1, mockFn2]);

		queue.flush();
		queue.flush();

		// Verify that the functions are executed only once
		expect(mockFn1).toHaveBeenCalledTimes(1);
		expect(mockFn2).toHaveBeenCalledTimes(1);
	});

	it('should handle an empty preloaded queue gracefully', () => {
		const queue = createCommercialQueue([]);

		expect(() => queue.flush()).not.toThrow();
	});
});

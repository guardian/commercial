import { createCommercialQueue } from './guardian-commercial-queue';

window.guardian.config.page.adUnit = 'adUnit';

describe('createCommercialQueue', () => {
	it('should return an object with push and flush methods', () => {
		const queue = createCommercialQueue();
		expect(queue).toBeDefined();
		expect(typeof queue.push).toBe('function');
		expect(typeof queue.flush).toBe('function');
	});
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
});

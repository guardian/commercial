import { TimedQueue } from './timed-queue';

// queuing relies on setTimeout
jest.useFakeTimers();

describe('TimedQueue', () => {
	let errorSpy: jest.SpyInstance;
	beforeAll(() => {
		// Suppress console.error during tests to keep output clean
		errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterAll(() => {
		errorSpy.mockRestore();
		jest.clearAllTimers();
	});

	it('adds and runs jobs immediately when not paused', () => {
		const queue = TimedQueue();
		const result: number[] = [];
		const job1 = jest.fn(() => result.push(1));
		const job2 = jest.fn(() => result.push(2));
		const job3 = jest.fn(() => result.push(3));

		queue.add(job1).add(job2).add(job3);

		expect(job1).toHaveBeenCalledTimes(1);
		expect(job2).toHaveBeenCalledTimes(1);
		expect(job3).toHaveBeenCalledTimes(1);

		// implicit test for order of jobs
		expect(result).toEqual([1, 2, 3]);
	});

	it('pauses and queues jobs', () => {
		const queue = TimedQueue();
		const job1 = jest.fn();
		const job2 = jest.fn();

		queue.pause().add(job1).add(job2);

		expect(job1).not.toHaveBeenCalled();
		expect(job2).not.toHaveBeenCalled();
	});

	it('drains and runs queued jobs after pause', () => {
		const queue = TimedQueue();
		const result: number[] = [];
		const job1 = jest.fn(() => result.push(1));
		const job2 = jest.fn(() => result.push(2));

		queue.pause();

		jest.advanceTimersByTime(1000);
		queue.add(job1);

		jest.advanceTimersByTime(1000);
		queue.add(job2).drain();

		jest.advanceTimersByTime(2000);

		expect(job1).toHaveBeenCalledTimes(1);
		expect(job2).toHaveBeenCalledTimes(1);
		expect(result).toEqual([1, 2]);
	});

	it('drains and runs zero-time queued jobs immediately after pause', () => {
		const queue = TimedQueue();
		const result: number[] = [];
		const job1 = jest.fn(() => result.push(1));
		const job2 = jest.fn(() => result.push(2));

		queue.pause().add(job1);
		jest.advanceTimersByTime(1000);

		queue.add(job2, true).drain();
		jest.advanceTimersToNextTimer();

		expect(job1).toHaveBeenCalledTimes(1);
		expect(job2).toHaveBeenCalledTimes(1);
		expect(result).toEqual([1, 2]);
	});

	it('allows multiple pause and drain cycles', async () => {
		const queue = TimedQueue();
		const job1 = jest.fn();
		const job2 = jest.fn();

		// first cycle
		queue.pause().add(job1).drain();
		await jest.advanceTimersToNextTimerAsync();

		// second cycle
		queue.pause().add(job2).drain();
		await jest.advanceTimersToNextTimerAsync();

		expect(job1).toHaveBeenCalledTimes(1);
		expect(job2).toHaveBeenCalledTimes(1);
	});

	it('handles drain without pause gracefully', () => {
		const queue = TimedQueue();
		const job1 = jest.fn();

		queue.add(job1);
		expect(job1).toHaveBeenCalledTimes(1);
		expect(() => queue.drain()).not.toThrow();

		const job2 = jest.fn();
		queue.add(job2);
		expect(job2).toHaveBeenCalledTimes(1);
	});

	it('handles pause without jobs gracefully', () => {
		const queue = TimedQueue();
		expect(() => queue.pause()).not.toThrow();
	});

	it('handles jobs that throw errors without stopping the queue', () => {
		const queue = TimedQueue();
		const job1 = jest.fn(() => {
			throw new Error('Job 1 failed');
		});
		const job2 = jest.fn();

		queue.pause().add(job1).add(job2);

		expect(() => queue.drain()).not.toThrow();
		jest.runAllTimers();

		expect(job1).toHaveBeenCalledTimes(1);
		expect(job2).toHaveBeenCalledTimes(1);
	});

	it('handles long-running jobs without blocking subsequent jobs', () => {
		const queue = TimedQueue();
		const results: number[] = [];

		const job1 = jest.fn(() => {
			return new Promise((resolve) => {
				setTimeout(() => {
					results.push(1);
					resolve(true);
				}, 5000);
			});
		});
		const job2 = jest.fn(() => results.push(2));

		queue.pause().add(job1).add(job2).drain();

		// advice time long enough for job1 to be incomplete
		jest.advanceTimersByTime(3000);
		expect(results).toEqual([2]);
	});

	it('runs new jobs after currently draining jobs are complete', async () => {
		const queue = TimedQueue();
		const results: number[] = [];

		const job1 = jest.fn(() => results.push(1));
		const job2 = jest.fn(() => results.push(2));
		const job3 = jest.fn(() => results.push(3));
		const job4 = jest.fn(() => results.push(4));

		// pause and drain a queue with job1 and job2 one second apart
		queue.pause().add(job1);
		jest.advanceTimersByTime(1000);
		queue.add(job2).drain();

		// add job3 and job4 while job2 is waiting to run
		// (500ms after drain, 500ms before job2 is scheduled to run)
		jest.advanceTimersByTime(500);
		queue.add(job3).add(job4);
		expect(results).toEqual([1]);

		// job2 should run now, with job3 and job4 waiting for job2 to finish
		// (1000ms after drain)
		jest.advanceTimersByTime(500);
		expect(results).toEqual([1, 2]);

		// move time just before job3 and job4 are scheduled to run and ensure it hasn't run yet
		// (1499ms after drain, 499ms after job2)
		await jest.advanceTimersByTimeAsync(499);
		expect(results).toEqual([1, 2]);

		// move time to allow job3 to run
		// (1500ms after drain, 500ms after job2)
		await jest.advanceTimersByTimeAsync(1);
		expect(results).toEqual([1, 2, 3, 4]);
	});

	// TODO: to be implemented
	it.skip('allows jobs to be paused while draining queue', async () => {
		const queue = TimedQueue();
		const results: number[] = [];

		const job1 = jest.fn(() => results.push(1));
		const job2 = jest.fn(() => results.push(2));

		// add job21 in a paused queue, then move 1 second forward
		queue.pause().add(job1);
		jest.advanceTimersByTime(1000);

		// add job2 and start draining the queue
		// job1 should run immediately, job2 should be queued
		queue.add(job2).drain();

		// while job2 is waiting to run, pause the queue again
		// (500ms after drain, 500ms before job2 is scheduled to run)
		jest.advanceTimersByTime(500);
		queue.pause();

		await jest.advanceTimersByTimeAsync(1000);
		expect(results).toEqual([1]);

		queue.drain();
		expect(results).toEqual([1, 2]);
	});
});

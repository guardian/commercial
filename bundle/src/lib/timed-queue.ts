type GenericJob = (...args: unknown[]) => unknown;

type TimedQueueJob<T> = {
	jobId: number;
	job: T;
	timestamp: number;
};

const createJob = <T>(job: T): TimedQueueJob<T> => ({
	job,
	jobId: Math.random(),
	timestamp: Date.now(),
});

const runJob = <T extends GenericJob>(
	job: T,
	timeDifference: number,
): Promise<unknown> => {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			try {
				resolve(job());
			} catch (e) {
				// Log the error but don't stop the queue
				console.error('TimedQueue job error:', e);
				reject(e instanceof Error ? e : new Error(String(e)));
			} finally {
				clearTimeout(timeoutId);
			}
		}, timeDifference);
	});
};

export function TimedQueue<T extends GenericJob>() {
	let pipeline = [] as Array<TimedQueueJob<T>>;
	let timeWhenPaused = 0;

	return {
		add(job: T) {
			if (pipeline.length || timeWhenPaused) {
				// if there are pending jobs or if the queue is paused
				// add to the queue to be run when drained
				const newJob = createJob(job);
				pipeline.push(newJob);
			} else {
				// run immediately if not paused and no pending jobs
				job();
			}
			return this;
		},

		drain(startTime = timeWhenPaused) {
			console.log("--- jobs in pipeline", pipeline.length);
			const lastJob = pipeline[pipeline.length - 1] ?? pipeline[0];
			const lastJobTimestamp = lastJob?.timestamp ?? 0;
			void Promise.allSettled(
				pipeline.map(({ jobId, job, timestamp }) => {
					const timeDifference = timestamp - startTime;
					console.log("---jobId", Math.round(jobId * 100000))
					return runJob(job, timeDifference).then(() => {
						// remove job from queue
						pipeline = pipeline.filter(
							(pipelineJob) => pipelineJob.jobId !== jobId,
						);
					});
				}),
			).finally(() => {
				if (pipeline.length && timeWhenPaused) {
					// if new jobs were added while draining and the queue is not paused, keep draining
					// with a new time equal to the last job in the previous batch's time
					this.drain(lastJobTimestamp);
				} else {
					// reset time to unpause the queue
					// and allow new jobs to run immediately
					timeWhenPaused = 0;
				}
			});
		},
		pause() {
			timeWhenPaused = Date.now();
			return this;
		},
	};
}

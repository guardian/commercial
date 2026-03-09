import { log } from '@guardian/libs';

type QueueItem = () => void;

type Queue = {
	push: (...items: QueueItem[]) => QueueItem[];
	flush: () => void;
};

const safelyExecuteQueueItem = (item: QueueItem) => {
	try {
		item();
	} catch (error) {
		console.error(`Error executing queue function during:`, error);
	}
};

/**
 * Sets up the commercial queue.
 * This allows scheduling of functions to run when commercial is ready.
 * By stubbing the queue as an empty array before initialisation, consumers can
 * add to the queue before commercial has booted on the page
 * @see /docs/architecture/implementations/002-commercial-queue-implementation.md
 * @param queueArr
 */
const createCommercialQueue = (queueArr: QueueItem[] = []): Queue => {
	const buffer: QueueItem[] = [...queueArr];
	let isInitialised = false;

	return {
		push(...items: QueueItem[]) {
			log(
				'commercial',
				`Pushing items to the commercial queue':\n ${items.join(',\n')}`,
			);
			items.forEach((item) => {
				if (isInitialised) {
					log(
						'commercial',
						`Executing queue item ${item.toString()}`,
					);
					safelyExecuteQueueItem(item);
				} else {
					log('commercial', `Queuing item ${item.toString()}`);
					buffer.push(item);
				}
			});
			return buffer;
		},

		flush() {
			log('commercial', 'Flushing commercial queue');
			log('commercial', `Queued items:\n ${buffer.join(',\n')}`);
			isInitialised = true;
			while (buffer.length > 0) {
				const item = buffer.shift();
				log('commercial', `Executing queue item ${item?.toString()}`);
				safelyExecuteQueueItem(item!);
			}
		},
	};
};

export { createCommercialQueue };
export type { Queue, QueueItem };

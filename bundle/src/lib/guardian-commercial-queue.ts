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

const createCommercialQueue = (queueArr: QueueItem[] = []): Queue => {
	const buffer: QueueItem[] = [...queueArr];
	let isInitialised = false;

	return {
		push(...items: QueueItem[]) {
			items.forEach((item) => {
				if (isInitialised) {
					safelyExecuteQueueItem(item);
				} else {
					buffer.push(item);
				}
			});
			return buffer;
		},

		flush() {
			isInitialised = true;
			while (buffer.length > 0) {
				const item = buffer.shift();
				safelyExecuteQueueItem(item!);
			}
		},
	};
};

export { createCommercialQueue };

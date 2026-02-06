type QueueFunction = () => void;

interface QueueArray {
	push: (...items: QueueFunction[]) => number;
	flush: () => void;
	getAll: () => QueueFunction[];
}

export const createCommercialQueue = (): QueueArray => {
	const buffer: QueueFunction[] = [];
	let isInitialised = false;
	const storage: QueueFunction[] = [];

	return {
		push(...items: QueueFunction[]) {
			items.forEach((item) => {
				if (isInitialised) {
					try {
						item();
					} catch (error) {
						console.error('Error executing queue function:', error);
					}
				} else {
					buffer.push(item);
				}
			});
			return storage.push(...items);
		},

		flush() {
			isInitialised = true;
			buffer.forEach((item: QueueFunction) => {
				try {
					item();
				} catch (error) {
					console.error('Error executing from buffer queue:', error);
				}
			});
			buffer.length = 0;
		},
		getAll() {
			return [...storage];
		},
	};
}

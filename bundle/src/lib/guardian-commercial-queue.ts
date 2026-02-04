type QueueFunction = () => void;

interface QueueArray {
	push: (...items: QueueFunction[]) => number;
	flush: () => void;
	[key: number]: QueueFunction;
	length: number;
}

export const createCommercialQueue = (): QueueArray => {
	let buffer: QueueFunction[] = [];
	let isInitialised = false;

	const targetArray: QueueFunction[] = [];

	const queue = new Proxy(targetArray, {
		get(target, property) {
			if (property === 'push') {
				return (...items: QueueFunction[]) => {
					if (isInitialised) {
						items.forEach((item) => {
							try {
								item();
							} catch (error) {
								console.error(
									'Error executing queue function:',
									error,
								);
							}
						});
					} else {
						buffer.push(...items);
					}
					return target.push(...items);
				};
			}
			if (property === 'flush') {
				return () => {
					isInitialised = true;
					buffer.forEach((item) => {
						try {
							item();
						} catch (error) {
							console.error(
								'Error executing buffered queue function:',
								error,
							);
						}
					});
					buffer = [];
				};
			}

			return Reflect.get(target, property);
		},
	});
	return queue as unknown as QueueArray;
};

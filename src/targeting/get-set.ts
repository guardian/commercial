class AsyncAdTargeting<T> {
	get: () => Promise<T>;
	set: (val: T) => number;
	resolver?: (val: T) => void;
	count: number;

	val: Promise<T>;

	constructor() {
		this.count = 0;

		this.val = new Promise<T>((resolve) => {
			this.resolver = resolve;
		});

		this.get = () => {
			return this.val;
		};

		this.set = (newVal: T) => {
			this.resolver?.(newVal);
			this.val = Promise.resolve(newVal);

			return ++this.count;
		};
	}
}

export { AsyncAdTargeting };

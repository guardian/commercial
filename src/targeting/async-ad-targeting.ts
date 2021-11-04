class AsyncAdTargeting<T> {
	get: () => Promise<T>;
	set: (val: T) => void;
	resolver?: (val: T) => void;

	val: Promise<T>;

	constructor() {
		this.val = new Promise<T>((resolve) => {
			this.resolver = resolve;
		});

		this.get = async () => {
			return this.val;
		};

		this.set = (newVal: T) => {
			this.resolver?.(newVal);
			this.val = Promise.resolve(newVal);
		};
	}
}

export { AsyncAdTargeting };

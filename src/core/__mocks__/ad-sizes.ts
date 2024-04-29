import { AdSize as RealAdSize } from 'core/ad-sizes';

class AdSize extends RealAdSize {
	constructor(arraySize: number);
	constructor([width, height]: [number, number]);
	constructor(args: [number, number] | number) {
		// The class needs to be able to be instantiable with a single number like a normal `Array`, so that it can be used in jest, where it uses this internally somehow.
		if (typeof args === 'number') {
			super([0, 0]);
		} else {
			super(args);
		}
	}
}

const createAdSize = (width: number, height: number): AdSize => {
	return new AdSize([width, height]);
};

export * from './ad-sizes';
export { createAdSize };

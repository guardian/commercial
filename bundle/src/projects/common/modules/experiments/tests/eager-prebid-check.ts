import { memoize } from 'lodash-es';
import { getSynchronousTestsToRun } from '../ab';
import { eagerPrebid } from './eager-prebid';

export const getEagerPrebidVariant = memoize((): string => {
	const tests = getSynchronousTestsToRun();
	const test = tests.find((test) => test.id === eagerPrebid.id);
	return test ? test.variantToRun.id : 'control';
});

// determine if the user is in any of the the eager prebid variants
export const isInEagerPrebidVariant = memoize((): boolean => {
	const variant = getEagerPrebidVariant();
	return variant !== 'control';
});

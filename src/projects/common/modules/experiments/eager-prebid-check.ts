import { memoize } from 'lodash-es';
import { getSynchronousTestsToRun } from './ab';
import { eagerPrebid } from './tests/eager-prebid';

/**
 * These functions can't be in the eager-prebid.ts file because there is a circular dependency
 */

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

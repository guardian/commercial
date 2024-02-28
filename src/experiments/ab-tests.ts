import type { ABTest } from '@guardian/ab-core';
import { mpuWhenNoEpic } from './tests/mpu-when-no-epic';

// keep in sync with ab-tests in dotcom-rendering
// https://github.com/guardian/dotcom-rendering/blob/main/dotcom-rendering/src/experiments/ab-tests.ts
export const concurrentTests: readonly ABTest[] = [
	// one test per line
	mpuWhenNoEpic,
	//
];

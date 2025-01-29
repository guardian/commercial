import type { ABTest } from '@guardian/ab-core';
import { mpuWhenNoEpic } from './tests/mpu-when-no-epic';
import { optOutFrequencyCap } from './tests/opt-out-frequency-cap';
import { prebidKeywords } from './tests/prebid-keywords';

/**
 * You only need to add tests to this file if the code you are testing is here in
 * the commercial code. Any test here also needs to be in both DCR and Frontend,
 * but any tests in DCR and Frontend do not need to necessarily be added here.
 */
export const concurrentTests: ABTest[] = [
	// one test per line
	mpuWhenNoEpic,
	optOutFrequencyCap,
	prebidKeywords,
];

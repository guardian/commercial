import type { ABTest } from '@guardian/ab-core';
import { prebidId5 } from './tests/prebid-id5';

/**
 * You only need to add tests to this file if the code you are testing is here in
 * the commercial code. Any test here also needs to be in both DCR and Frontend,
 * but any tests in DCR and Frontend do not need to necessarily be added here.
 */
export const concurrentTests: ABTest[] = [
	// one test per line
	prebidId5,
];

import type { GetThirdPartyTag } from '../types';

/**
 * Permutive script updates local user segmentation data
 * @param  {} {shouldRun}
 */
export const permutive: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//cdn.permutive.com/d6691a17-6fdb-4d26-85d6-b3dd27f55f08-web.js',
	name: 'permutive',
});

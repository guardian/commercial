import { admiralScript } from '../__vendor/admiral';
import type { GetThirdPartyTag } from '../types';

/**
 * Admiral adblocker recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	insertSnippet: admiralScript,
	async: true,
});

// Exports for testing only
export const _ = {};

export { admiralTag };

import { log } from '@guardian/libs';
import { admiralScript } from '../__vendor/admiral';
import type { GetThirdPartyTag } from '../types';

/**
 * Admiral adblock recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	insertSnippet: admiralScript,
	async: true,
	beforeLoad: () =>
		log('commercial', '🛡️ Loading Admiral script on the page'),
});

export { admiralTag };

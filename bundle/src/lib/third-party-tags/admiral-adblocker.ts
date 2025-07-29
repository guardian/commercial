import { log } from '@guardian/libs';
import type { GetThirdPartyTag } from '../types';

const admiralUrl =
	window.guardian.config.stage === 'CODE'
		? 'https://code.api.nextgen.guardianapps.co.uk/commercial/admiral-bootstrap'
		: 'https://api.nextgen.guardianapps.co.uk/commercial/admiral-bootstrap';

/**
 * Admiral adblock recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	async: true,
	url: admiralUrl,
	beforeLoad: () =>
		log('commercial', '🛡️ Loading Admiral script on the page'),
});

export { admiralTag };

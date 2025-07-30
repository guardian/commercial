import { log } from '@guardian/libs';
import type { GetThirdPartyTag } from '../types';

const baseAjaxUrl =
	window.guardian.config.stage === 'CODE'
		? 'https://code.api.nextgen.guardianapps.co.uk'
		: 'https://api.nextgen.guardianapps.co.uk';

/**
 * Admiral adblock recovery tag
 */
const admiralTag: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	name: 'admiral',
	async: true,
	url: `${baseAjaxUrl}/commercial/admiral-bootstrap.js`,
	beforeLoad: () =>
		log('commercial', '🛡️ Loading Admiral script on the page'),
});

export { admiralTag };

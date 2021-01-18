import config from '@guardian/frontend/static/src/javascripts/lib/config';
import { isInAuOrNz } from '@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/geo-utils';

// nol_t is a global function defined by the IMR worldwide library

const onLoad = () => {
	const pvar = {
		cid: 'au-guardian',
		content: '0',
		server: 'secure-gl',
	};

	const trac = window.nol_t(pvar);
	trac.record().post();
};

export const imrWorldwideLegacy = {
	shouldRun: config.get('switches.imrWorldwide') && isInAuOrNz(),
	url: '//secure-au.imrworldwide.com/v60.js',
	onLoad,
};

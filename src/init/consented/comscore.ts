import { getConsentFor, loadScript, log, onConsent } from '@guardian/libs';
import { once } from 'lodash-es';
import { commercialFeatures } from '../../lib/commercial-features';
import type { ComscoreGlobals } from '../../types/global';

const comscoreSrc = '//sb.scorecardresearch.com/cs/6035250/beacon.js';
const comscoreC1 = '2';
const comscoreC2 = '6035250';

const getGlobals = (keywords: string): ComscoreGlobals => {
	const globals: ComscoreGlobals = {
		c1: comscoreC1,
		c2: comscoreC2,
		cs_ucfr: '1',
		options: {
			enableFirstPartyCookie: true,
		},
	};

	if (keywords !== 'Network Front') {
		// comscore keywords shouldn't contain spaces or ampersands
		globals.comscorekw = keywords.replace(/ /g, '_').replace(/&/g, 'and');
	}

	return globals;
};

const initOnConsent = () => {
	window._comscore = window._comscore ?? [];
	window._comscore.push(getGlobals(window.guardian.config.page.keywords));

	return loadScript(comscoreSrc, { id: 'comscore', async: true });
};

/**
 * Initialise comscore, industry-wide audience tracking
 * https://www.comscore.com/About
 */
const setupComscore = async (): Promise<void> => {
	if (!commercialFeatures.comscore) {
		return Promise.resolve();
	}
	try {
		const consentState = await onConsent();
		/* Rule is that comscore can run:
		- in Tcfv2: Based on consent for comscore
		- in Australia: Always
		- in USNAT: If the user hasn't chosen Do Not Sell
		TODO move this logic to getConsentFor
		*/
		const canRunTcfv2 =
			(consentState.tcfv2 && getConsentFor('comscore', consentState)) ??
			false;
		const canRunAus = !!consentState.aus;
		const canRunUsnat =
			!!consentState.usnat && !consentState.usnat.doNotSell;

		if (!(canRunTcfv2 || canRunAus || canRunUsnat)) {
			throw Error('No consent for comscore');
		}
		await initOnConsent();
		return;
	} catch (e) {
		log('commercial', '⚠️ Failed to execute comscore', e);
	}
};

const setupComscoreOnce = once(setupComscore);

export const init = (): Promise<void> => setupComscoreOnce();

export const _ = {
	getGlobals,
	setupComscore,
	comscoreSrc,
	comscoreC1,
	comscoreC2,
};

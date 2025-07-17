/* A regionalised container for all the commercial tags. */

import { isInUsa } from '@guardian/commercial-core/geo/geo-utils';
import { getConsentFor, onConsent } from '@guardian/libs';
import { isUserInVariant } from '../../experiments/ab';
import { admiralAdblockRecovery } from '../../experiments/tests/admiral-adblocker-recovery';
import { commercialFeatures } from '../../lib/commercial-features';
import fastdom from '../../lib/fastdom-promise';
import { admiralTag as admiral } from '../../lib/third-party-tags/admiral-adblocker';
import { ias } from '../../lib/third-party-tags/ias';
import { imrWorldwide } from '../../lib/third-party-tags/imr-worldwide';
import { imrWorldwideLegacy } from '../../lib/third-party-tags/imr-worldwide-legacy';
import { inizio } from '../../lib/third-party-tags/inizio';
import { permutive } from '../../lib/third-party-tags/permutive';
import { remarketing } from '../../lib/third-party-tags/remarketing';
import type { ThirdPartyTag } from '../../types/global';

const createTagScript = (tag: ThirdPartyTag) => {
	const script = document.createElement('script');
	if (typeof tag.url !== 'undefined') {
		script.src = tag.url;
	}
	// script.onload cannot be undefined
	script.onload = tag.onLoad ?? null;
	if (tag.async === true) {
		script.setAttribute('async', '');
	}
	if (tag.attrs) {
		tag.attrs.forEach((attr) => {
			script.setAttribute(attr.name, attr.value);
		});
	}
	return script;
};

const addScripts = (tags: ThirdPartyTag[]) => {
	const ref = document.scripts[0];
	const frag = document.createDocumentFragment();
	let hasScriptsToInsert = false;

	tags.forEach((tag) => {
		if (tag.loaded === true) return;

		tag.beforeLoad?.();

		// Tag is either an image, a snippet or a script.
		if (tag.useImage === true && typeof tag.url !== 'undefined') {
			new Image().src = tag.url;
		} else if (tag.insertSnippet) {
			tag.insertSnippet();
		} else {
			hasScriptsToInsert = true;
			const script = createTagScript(tag);
			frag.appendChild(script);
		}
		tag.loaded = true;
	});

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive
	if (hasScriptsToInsert) {
		return fastdom.mutate(() => {
			if (ref?.parentNode) {
				ref.parentNode.insertBefore(frag, ref);
			}
		});
	}
	return Promise.resolve();
};

const insertScripts = async (
	advertisingServices: ThirdPartyTag[],
	performanceServices: ThirdPartyTag[], // performanceServices always run
): Promise<void> => {
	void addScripts(performanceServices);
	const consentState = await onConsent();
	const consentedAdvertisingServices = advertisingServices.filter(
		(script) => {
			if (script.name === undefined) return false;
			return getConsentFor(script.name, consentState);
		},
	);

	if (consentedAdvertisingServices.length > 0) {
		void addScripts(consentedAdvertisingServices);
	}
};

const loadOther = (): Promise<void> => {
	const shouldLoadAdmiral =
		isInUsa() && isUserInVariant(admiralAdblockRecovery, 'variant');

	console.log('=====> checking admiral status');
	console.log({
		shouldLoadAdmiral,
		isInUs: isInUsa(),
		isInABTest: isUserInVariant(admiralAdblockRecovery, 'variant'),
	});

	const advertisingServices: ThirdPartyTag[] = [
		remarketing({
			shouldRun: window.guardian.config.switches.remarketing ?? false,
		}),
		permutive({
			shouldRun: window.guardian.config.switches.permutive ?? false,
		}),
		ias,
		inizio({ shouldRun: window.guardian.config.switches.inizio ?? false }),
		/**
		 * Admiral should only run:
		 * - if user has consented (ie not "do not sell")
		 * - in the US
		 * - if the feature switch is turned on
		 * - if user is opted into the client-side AB test
		 */
		admiral({
			shouldRun:
				isInUsa() && isUserInVariant(admiralAdblockRecovery, 'variant'),
		}),
	].filter((_) => _.shouldRun);

	const performanceServices: ThirdPartyTag[] = [
		// a.k.a Nielsen Online - provides measurement and analysis of online audiences,
		// advertising, video, consumer-generated media, word of mouth, commerce and consumer behavior.
		imrWorldwide, // only in AU & NZ
		imrWorldwideLegacy, // only in AU & NZ
	].filter((_) => _.shouldRun);

	return insertScripts(advertisingServices, performanceServices);
};

const init = async (): Promise<boolean> => {
	if (commercialFeatures.thirdPartyTags) {
		void loadOther();
		return Promise.resolve(true);
	}
	return Promise.resolve(false);
};

export { init };
export const _ = {
	insertScripts,
	loadOther,
};

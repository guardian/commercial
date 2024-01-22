/* A regionalised container for all the commercial tags. */

import {
	getConsentFor,
	onConsent,
} from '@guardian/consent-management-platform';
import { ias } from 'core/third-party-tags/ias';
import { inizio } from 'core/third-party-tags/inizio';
import { permutive } from 'core/third-party-tags/permutive';
import { remarketing } from 'core/third-party-tags/remarketing';
import { twitter } from 'core/third-party-tags/twitter-uwt';
import { commercialFeatures } from 'lib/commercial-features';
import type { ThirdPartyTag } from 'types/global';
import fastdom from '../../lib/fastdom-promise';
import { imrWorldwide } from '../../lib/third-party-tags/imr-worldwide';
import { imrWorldwideLegacy } from '../../lib/third-party-tags/imr-worldwide-legacy';

const addScripts = (tags: ThirdPartyTag[]) => {
	const ref = document.scripts[0];
	const frag = document.createDocumentFragment();
	let hasScriptsToInsert = false;

	tags.forEach((tag) => {
		if (tag.loaded === true) return;

		if (tag.beforeLoad) tag.beforeLoad();

		// Tag is either an image, a snippet or a script.
		if (tag.useImage === true && typeof tag.url !== 'undefined') {
			new Image().src = tag.url;
		} else if (tag.insertSnippet) {
			tag.insertSnippet();
		} else {
			hasScriptsToInsert = true;
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
	await addScripts(performanceServices);
	const consentState = await onConsent();
	const consentedAdvertisingServices = advertisingServices.filter(
		(script) => {
			if (script.name === undefined) return false;
			return getConsentFor(script.name, consentState);
		},
	);

	if (consentedAdvertisingServices.length > 0) {
		await addScripts(consentedAdvertisingServices);
	}
};

const loadOther = (): Promise<void> => {
	const advertisingServices: ThirdPartyTag[] = [
		remarketing({
			shouldRun: window.guardian.config.switches.remarketing ?? false,
		}),
		permutive({
			shouldRun: window.guardian.config.switches.permutive ?? false,
		}),
		ias,
		inizio({ shouldRun: window.guardian.config.switches.inizio ?? false }),
		twitter({
			shouldRun: window.guardian.config.switches.twitterUwt ?? false,
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
	if (!commercialFeatures.thirdPartyTags) {
		return Promise.resolve(false);
	}
	await loadOther();
	return Promise.resolve(true);
};

export { init };
export const _ = {
	insertScripts,
	loadOther,
};

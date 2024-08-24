import type { Participations } from '@guardian/ab-core';
import type { ConsentState } from '@guardian/libs';
import { log } from '@guardian/libs';
import type { CustomParams, MaybeArray } from '../types';
import { buildPageTargeting, filterValues } from './build-page-targeting';

/**
 * @param  {Record<string, MaybeArray<string|number|boolean>>
 * Follows https://support.google.com/admanager/answer/1080597
 */
const encodeCustomParams = (
	params: Record<string, MaybeArray<string>>,
): string => {
	const encodedParams = Object.entries(params)
		.map(([key, value]) => {
			const queryValue = Array.isArray(value)
				? value.join(',')
				: String(value);
			return `${key}=${encodeURIComponent(queryValue)}`;
		})
		.join('&');
	return encodedParams;
};

const mergeCustomParamsWithTargeting = (
	customParams: CustomParams,
	consentState: ConsentState,
	clientSideParticipations: Participations,
	isSignedIn: boolean,
) => {
	let pageTargeting = {};
	try {
		pageTargeting = buildPageTargeting({
			adFree: false,
			clientSideParticipations,
			consentState: consentState,
			isSignedIn: isSignedIn,
		});
	} catch (e) {
		/**
		 * Defensive error handling in case YoutubeAtom is used in an
		 * environment where guardian.config, cookies, localstorage etc
		 * are not available
		 */
		log('commercial', 'Error building YouTube IMA custom params', e);
		return customParams;
	}
	const mergedCustomParams = {
		...customParams,
		...pageTargeting,
	};
	return mergedCustomParams;
};

type BuildImaAdTagUrl = {
	adUnit: string;
	customParams: CustomParams;
	consentState: ConsentState;
	clientSideParticipations: Participations;
	isSignedIn: boolean;
};

const buildImaAdTagUrl = ({
	adUnit,
	clientSideParticipations,
	consentState,
	customParams,
	isSignedIn,
}: BuildImaAdTagUrl): string => {
	const mergedCustomParams = mergeCustomParamsWithTargeting(
		customParams,
		consentState,
		clientSideParticipations,
		isSignedIn,
	);
	const queryParams = {
		iu: adUnit,
		tfcd: '0',
		npa: '0',
		sz: '480x360|480x361|400x300',
		gdfp_req: '1',
		output: 'vast',
		unviewed_position_start: '1',
		env: 'vp',
		impl: 's',
		vad_type: 'linear',
		vpos: 'preroll',
		/**
		 * cust_params string is encoded
		 * cust_params values are also encoded so they will get double encoded
		 * this ensures any values with separator chars (=&,) do not conflict with the main string
		 */
		cust_params: encodeURIComponent(
			encodeCustomParams(filterValues(mergedCustomParams)),
		),
	};

	const queryParamsArray = [];
	for (const [k, v] of Object.entries(queryParams)) {
		queryParamsArray.push(`${k}=${v}`);
	}
	return (
		'https://pubads.g.doubleclick.net/gampad/ads?' +
		queryParamsArray.join('&')
	);
};

export { buildImaAdTagUrl };

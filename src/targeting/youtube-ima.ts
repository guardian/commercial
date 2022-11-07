import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { CustomParams, MaybeArray } from '../types';
import { buildPageTargeting, filterValues } from './build-page-targeting';

/**
 * @param  {Record<string, MaybeArray<string|number|boolean>>
 * Follows https://support.google.com/admanager/answer/1080597
 */
const encodeVastTagKeyValues = (
	query: Record<string, MaybeArray<string>>,
): string => {
	const unencodedUrl = Object.entries(query)
		.map(([key, value]) => {
			const queryValue = Array.isArray(value)
				? value.join(',')
				: String(value);
			return `${key}=${queryValue}`;
		})
		.join('&');
	return unencodedUrl
		.replace(/=/g, '%3D')
		.replace(/&/g, '%26')
		.replace(/,/g, '%2C');
};

const buildImaAdTagUrl = (
	adUnit: string,
	customParams: CustomParams,
	consentState: ConsentState,
): string => {
	const pageTargeting = buildPageTargeting(consentState, false);
	const mergedCustomParams = { ...customParams, ...pageTargeting };

	const queryParams = {
		iu: adUnit,
		description_url: '[placeholder]', // do we need this?
		tfcd: '0',
		npa: '0',
		sz: '480x360|480x361|400x300',
		gdfp_req: '1',
		output: 'vast',
		unviewed_position_start: '1',
		env: 'vp',
		impl: 's',
		correlator: '', // do we need this?
		vad_type: 'linear',
		vpos: 'preroll',
		cust_params: encodeVastTagKeyValues(filterValues(mergedCustomParams)),
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

import type { Participations } from '@guardian/ab-core';
import type { CustomParams, MaybeArray } from '../types';
import { filterEmptyValues } from './build-page-targeting';

/**
 * @param  {Record<string, MaybeArray<string|number|boolean>>
 * do this https://support.google.com/admanager/answer/1080597
 */
const encodeVastTagKeyValues = (
	query: Record<string, MaybeArray<string | number | boolean>>,
): string => {
	const unencodedUrl = Object.entries(query)
		.map(([key, value]) => {
			let queryValue: string;
			if (Array.isArray(value)) {
				queryValue = value.join(',');
			} else if (typeof value == 'boolean' || typeof value == 'number') {
				queryValue = value.toString();
			} else {
				queryValue = value;
			}
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
	clientSideParticipations: Participations,
): string => {
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
		cust_params: encodeVastTagKeyValues(filterEmptyValues(customParams)),
	};

	const queryParamsArray = [];
	for (const [k, v] of Object.entries(queryParams)) {
		queryParamsArray.push(`${k}=${v}`);
	}
	return (
		'https://pubads.g.doubleclick.net/gampad/live/ads?' +
		queryParamsArray.join('&')
	);
};

export { buildImaAdTagUrl };

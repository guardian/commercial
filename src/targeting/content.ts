import { isString } from '@guardian/libs';
import type { False, True } from '../types';
import type { SharedTargeting } from './shared';

/* -- Types -- */

const videoLengths = [
	'25', // TODO: confirm this is a real value
	'30',
	'60',
	'90',
	'120',
	'150',
	'180',
	'210',
	'240',
	'270',
	'300',
] as const;

/**
 * Content Targeting comes from the server
 *
 * For a specific URL, it will only change on
 * - a Composer/CAPI update
 * - a rendering platform capability update
 * - a main media update
 * - a series tag update
 * - a surge in page views per minute
 *
 */
export type ContentTargeting = {
	/**
	 * **D**ot**c**om-**r**endering **E**ligible - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11958028
	 */
	dcre: True | False;

	/**
	 * Rendering Platform - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11881005
	 */
	rp: 'dotcom-rendering' | 'dotcom-platform';

	/**
	 * Site **S**ection - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=173967
	 */
	s: string;

	/**
	 * **Sens**itive - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11654206
	 */
	sens: True | False;

	/**
	 * URL Keywords - [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12058265
	 */
	urlkw: string[];

	/**
	 * **V**ideo **L**ength - [see on Ad Manager][gam]
	 *
	 * Video.JS only (?)
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=195087
	 */
	vl: null | typeof videoLengths[number];
};

/* -- Methods -- */

const getVideoLength = (videoLength: number): ContentTargeting['vl'] => {
	const index = Math.min(Math.ceil(videoLength / 30), 10);
	return videoLengths[index] ?? null;
};

const getUrlKeywords = (url: SharedTargeting['url']): string[] => {
	const lastSegment = url
		.split('/')
		.filter(Boolean) // This handles a trailing slash
		.slice(-1)[0];

	return isString(lastSegment) ? lastSegment.split('-').filter(Boolean) : [];
};

/* -- Targeting -- */

export const getContentTargeting = ({
	eligibleForDCR,
	path,
	renderingPlatform,
	section,
	sensitive,
	videoLength,
}: {
	eligibleForDCR: boolean;
	path: SharedTargeting['url'];
	renderingPlatform: ContentTargeting['rp'];
	section: ContentTargeting['s'];
	sensitive: boolean;
	videoLength?: number;
}): ContentTargeting => {
	return {
		dcre: eligibleForDCR ? 't' : 'f',
		rp: renderingPlatform,
		s: section,
		sens: sensitive ? 't' : 'f',
		urlkw: getUrlKeywords(path),
		vl: videoLength ? getVideoLength(videoLength) : null,
	};
};

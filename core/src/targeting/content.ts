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
type ContentTargeting = {
	/**
	 * **D**ot**c**om-**r**endering **E**ligible - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11958028
	 */
	dcre: True | False;

	/**
	 * **R**ecently Published **C**ontent - [see on Ad Manager][gam]
	 *
	 * [gam]: TODO: add URL here once it's been created
	 */
	rc: string;

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
	vl: null | (typeof videoLengths)[number];
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

// "0" means content < 2 hours old
// "1" means content between 2 hours and 24 hours old.
// "2" means content between 24 hours and 3 days old
// "3" means content between 3 and 7 days old
// "4" means content between 7 days and 1 month old
// "5" means content between 1 and 10 months old
// "6" means content between 10 and 14 months old
// "7" means content more than 14 months old
const calculateRecentlyPublishedBucket = (
	webPublicationDate: number,
): string => {
	const now = Date.now();
	const hoursSincePublication = (now - webPublicationDate) / 1000 / 60 / 60;
	const daysSincePublication = hoursSincePublication / 24;
	const monthsSincePublication = daysSincePublication / 30; // near enough for our purposes

	if (hoursSincePublication < 2) return '0';
	if (hoursSincePublication < 24) return '1';
	if (daysSincePublication < 3) return '2';
	if (daysSincePublication < 7) return '3';
	if (daysSincePublication < 30) return '4';
	if (monthsSincePublication < 10) return '5';
	if (monthsSincePublication < 14) return '6';
	return '7';
};

/* -- Targeting -- */

type Content = {
	eligibleForDCR: boolean;
	path: SharedTargeting['url'];
	renderingPlatform: ContentTargeting['rp'];
	section: ContentTargeting['s'];
	sensitive: boolean;
	videoLength?: number;
	webPublicationDate: number;
};

const getContentTargeting = ({
	eligibleForDCR,
	path,
	renderingPlatform,
	section,
	sensitive,
	videoLength,
	webPublicationDate,
}: Content): ContentTargeting => {
	return {
		dcre: eligibleForDCR ? 't' : 'f',
		rc: calculateRecentlyPublishedBucket(webPublicationDate),
		rp: renderingPlatform,
		s: section,
		sens: sensitive ? 't' : 'f',
		urlkw: getUrlKeywords(path),
		vl: videoLength ? getVideoLength(videoLength) : null,
	};
};

export { getContentTargeting };
export type { ContentTargeting };

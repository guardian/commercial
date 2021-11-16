import { isString } from '@guardian/libs';
import type { False, True } from '../types';

/* -- Types -- */

const brands = {
	Foundation: 'f',
	Paid: 'p',
	Sponsored: 's',
} as const;

const editions = {
	UnitedKingdom: 'uk',
	UnitedStates: 'us',
	Australia: 'au',
	International: 'int',
} as const;

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

const surges = {
	0: '0',
	50: '5',
	100: '4',
	200: '3',
	300: '2',
	400: '1',
} as const;

const platforms = {
	R2: 'r2',
	NextGen: 'ng',
	MobileApp: 'app',
	AcceleratedMobilePages: 'amp',
} as const;

const contentTypes = [
	'article',
	'audio',
	'crossword',
	'gallery',
	'interactive',
	'liveblog',
	'network-front',
	'section',
	'tag',
	'video',
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
	 * **Bl**og tags – [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=186687
	 */
	bl: string[];

	/**
	 * **Br**anding - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=259767
	 */
	br: typeof brands[keyof typeof brands] | null;

	/**
	 * **Co**ntributor - [see on Ad Manager][gam]
	 *
	 * Array of all contributors to the content on the page
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=186207
	 */
	co: string[];

	/**
	 * **C**ontent **T**ype - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=177807
	 */
	ct: typeof contentTypes[number];

	/**
	 * **D**ot**c**om-**r**endering **E**ligible - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=177807
	 */
	dcre: True | False;

	/**
	 * **Edition** - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=174207
	 */
	edition: typeof editions[keyof typeof editions];

	/**
	 * **K**eywords - [see on Ad Manager][gam]
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=177687
	 */
	k: string[];

	/**
	 * **Ob**server Content - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=256887
	 */
	ob: 't' | null;

	/**
	 * **P**latform - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180207
	 */
	p: typeof platforms[keyof typeof platforms];

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
	 * **Se**ries - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180447
	 */
	se: string[];

	/**
	 * **Sens**itive - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=11654206
	 */
	sens: True | False;

	/**
	 * **Su**rging Article - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=185007
	 */
	su: Array<typeof surges[keyof typeof surges]>;

	/**
	 * **T**o**n**es - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=191487
	 */
	tn: string[];

	/**
	 * **U**niform **R**esource **L**ocator - [see on Ad Manager][gam]
	 *
	 * Relative to `www.theguardian.com`, starts with `/`
	 *
	 * Type: _Dynamic_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=174327
	 */
	url: `/${string}`;

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

const getUrlKeywords = (url: ContentTargeting['url']): string[] => {
	const lastSegment = url
		.split('/')
		.filter(Boolean) // This handles a trailing slash
		.slice(-1)[0];

	return isString(lastSegment) ? lastSegment.split('-').filter(Boolean) : [];
};

const getSurgingParam = (surging: number): ContentTargeting['su'] => {
	if (surging < 50 || isNaN(surging)) return ['0'];

	const thresholds: Array<keyof typeof surges> = [400, 300, 200, 100, 50];
	return thresholds.filter((n) => n <= surging).map((s) => surges[s]);
};

/* -- Targeting -- */

export const getContentTargeting = (
	{
		branding,
		contentType,
		contributors,
		platform,
		sensitive,
		tones,
		path,
		videoLength,
		surging,
	}: {
		branding?: keyof typeof brands;
		contentType: typeof contentTypes[number];
		contributors: string[];
		platform: keyof typeof platforms;
		sensitive: boolean;
		tones: ContentTargeting['tn'];
		path: ContentTargeting['url'];
		videoLength?: number;
		surging: number;
	},
	targeting: Omit<
		ContentTargeting,
		'br' | 'ct' | 'co' | 'p' | 'sens' | 'tn' | 'url' | 'urlkw' | 'vl' | 'su'
	>,
): ContentTargeting => {
	return {
		...targeting,
		br: branding ? brands[branding] : null,
		co: contributors,
		ct: contentType,
		p: platforms[platform],
		sens: sensitive ? 't' : 'f',
		tn: tones,
		su: getSurgingParam(surging),
		url: path,
		urlkw: getUrlKeywords(path),
		vl: videoLength ? getVideoLength(videoLength) : null,
	};
};

// Always the same for a single page view. Comes from the server?

import { AsyncAdTargeting } from './get-set';
import type { False, True } from '.';

type ValuesOf<T extends Record<string, string>> = T[keyof T];

const branding = {
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

const surging = {
	'Not surging': '0',
	'50-100 page view per minute': '5',
	'100+ page view per minute': '4',
	'200+ page view per minute': '3',
	'300+ page view per minute': '2',
	'400+ page view per minute': '1',
} as const;

const platform = {
	R2: 'r2',
	NextGen: 'ng',
	MobileApp: 'app',
	AcceleratedMobilePages: 'amp',
} as const;

const contentType = [
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
	br: ValuesOf<typeof branding>;

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
	ct: typeof contentType[number];

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
	edition: ValuesOf<typeof editions>;

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
	p: ValuesOf<typeof platform>;

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
	su: ValuesOf<typeof surging>;

	/**
	 * **T**o**n**e - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=191487
	 */
	tn: string;

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
	vl: typeof videoLengths[number];
};

const contentTargeting = new AsyncAdTargeting<ContentTargeting>();

const initContentTargeting = (targeting: ContentTargeting): number =>
	contentTargeting.set(targeting);

const getContentTargeting = (): Promise<ContentTargeting> =>
	contentTargeting.get();

export { initContentTargeting, getContentTargeting };

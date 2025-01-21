import { pickTargetingValues } from './pick-targeting-values';

/* -- Types -- */

const brands = {
	Foundation: 'f',
	Paid: 'p',
	Sponsored: 's',
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

const editions = {
	UnitedKingdom: 'uk',
	UnitedStates: 'us',
	Australia: 'au',
	International: 'int',
} as const;

const platforms = {
	R2: 'r2',
	NextGen: 'ng',
	MobileApp: 'app',
	AcceleratedMobilePages: 'amp',
} as const;

const surges = {
	0: '0',
	50: '5',
	100: '4',
	200: '3',
	300: '2',
	400: '1',
} as const;

/**
 * Shared Targeting is passed by `frontend`:
 * https://github.com/guardian/frontend/blob/5b970cd7308175cfc1bcae2d4fb8c06ee13c5fa0/common/app/common/commercial/EditionAdTargeting.scala
 *
 * It is generated in `commercial-shared`:
 * https://github.com/guardian/commercial-shared/blob/a692e8b2eba6e79eeeb666e5594f2193663f6514/src/main/scala/com/gu/commercial/display/AdTargetParam.scala
 *
 *
 *
 */
type SharedTargeting = {
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
	br: (typeof brands)[keyof typeof brands];

	/**
	 * **Co**ntributors and Authors - [see on Ad Manager][gam]
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
	ct: (typeof contentTypes)[number];

	/**
	 * **Edition** - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=174207
	 */
	edition: (typeof editions)[keyof typeof editions];

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
	ob: 't';

	/**
	 * **P**latform - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180207
	 */
	p: (typeof platforms)[keyof typeof platforms];

	/**
	 * **Se**ries - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=180447
	 */
	se: string[];

	/**
	 * **Sh**ort URL - [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=286047
	 */
	sh: `https://www.theguardian.com/p/${string}`;

	/**
	 * **Su**rging Article - [see on Ad Manager][gam]
	 *
	 * Type: _Predefined_
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=185007
	 */
	su: Array<(typeof surges)[keyof typeof surges]>;

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
};

/* -- Methods -- */

const getSurgingParam = (surging: number): SharedTargeting['su'] => {
	if (surging < 50 || isNaN(surging)) return ['0'];

	const thresholds: Array<keyof typeof surges> = [400, 300, 200, 100, 50];
	return thresholds.filter((n) => n <= surging).map((s) => surges[s]);
};

/* -- Targeting -- */

/**
 * What goes in comes out
 */
const getSharedTargeting = (
	shared: Partial<SharedTargeting>,
): Partial<SharedTargeting> => pickTargetingValues(shared);

export const _ = {
	getSurgingParam,
};

export type { SharedTargeting };
export { getSharedTargeting };

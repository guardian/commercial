// Always the same for a single page view. Comes from the server?

import type { False, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

/**
 * Content Targeting comes from the server
 *
 * For a specific URL, it will only change on
 * - a Composer/CAPI update
 * - a rendering platform capability update
 * - a main media update
 * - a series tag update
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
	br: 's' | 'p' | 'f'; // BRanding
	co: string; // COntributor
	ct: ContentType;
	dcre: True | False; // DotCom-Rendering Eligible
	edition: 'uk' | 'us' | 'au' | 'int';
	k: string[]; // Keywords
	ob: 't' | null; // OBserver content
	p: 'r2' | 'ng' | 'app' | 'amp'; // Platform (web)
	rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
	s: string; // site Section
	se: string; // SEries
	sens: True | False; // SenSitive
	su: string; // SUrging article
	tn: string; // ToNe
	url: string;
	urlkw: string[]; // URL KeyWords
	vl: string; // Video Length
};

type ContentType =
	| 'article'
	| 'audio'
	| 'crossword'
	| 'gallery'
	| 'interactive'
	| 'liveblog'
	| 'network-front'
	| 'section'
	| 'tag'
	| 'video';

const contentTargeting = new AsyncAdTargeting<ContentTargeting>();

const initContentTargeting = (targeting: ContentTargeting): void =>
	contentTargeting.set(targeting);

const getContentTargeting = (): Promise<ContentTargeting> =>
	contentTargeting.get();

export { initContentTargeting, getContentTargeting };

// Always the same for a single page view. Comes from the server?

import type { False, True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

// AVAILABLE: instantly
export type ContentTargeting = {
	bl: string[]; // BLog tags
	br: 's' | 'p' | 'f'; // BRanding
	co: string; // COntributor
	ct: ContentType;
	edition: 'uk' | 'us' | 'au' | 'int';
	k: string[]; // Keywords
	ob: 't'; // OBserver content
	p: 'r2' | 'ng' | 'app' | 'amp'; // Platform (web)
	s: string; // site Section
	se: string; // SEries
	sens: True | False; // SenSitive
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

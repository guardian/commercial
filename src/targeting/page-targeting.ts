import type { CountryCode } from '@guardian/libs';

const frequency = [
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6-9',
	'10-15',
	'16-19',
	'20-29',
	'30plus',
] as const;

const adManagerGroups = [
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'11',
	'12',
] as const;

type Frequency = typeof frequency[number];
type AdManagerGroup = typeof adManagerGroups[number];

type True = 't';
type False = 'f';
type NotApplicable = 'na';

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

type NotSureTargeting = {
	gdncrm: string | string[]; // GuarDiaN CRM
	ms: string; // Media Source
	slot: string; // (predefined list)
	x: string; // kruX user segments (deprecated?)
};

// Always the same for a single page view. Comes from the server?
type ContentTargeting = {
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

type ServerTargeting = {
	ab: string[];
	dcre: True | False; // DotCom-Rendering Eligible
	rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
	su: string; // SUrging article
};

// User / PageView / Experiments. Cookies + localStorage
type VisitorTargeting = {
	af: 't'; // Ad Free
	amtgrp: AdManagerGroup;
	at: string; // Ad Test
	cc: CountryCode; // Country Code
	fr: Frequency; // FRequency
	permutive: string[];
	pv: string; // ophan Page View id
	ref: string; // REFerrer
	si: True | False; // Signed In
};

type ViewportTargeting = Partial<{
	bp: 'mobile' | 'tablet' | 'desktop'; // BreakPoint
	inskin: True | False; // InSkin
	skinsize: 'l' | 's';
}>;

type ConsentTargeting = {
	cmp_interaction?: string; // predefined? 'cmpuseraction' and others
	consent_tcfv2: True | False | NotApplicable;
	pa: True | False; // Personalised Ads consent
	rdp: True | False | NotApplicable;
};

export type PageTargeting = NotSureTargeting &
	ContentTargeting &
	ServerTargeting &
	VisitorTargeting &
	ViewportTargeting &
	ConsentTargeting;

const viewportTargeting: ViewportTargeting = {};

export const onViewportChange = (): void => {
	viewportTargeting.bp = 'desktop'; // something or other
};

const consentTargeting: ConsentTargeting = {
	pa: 'f',
	consent_tcfv2: 'na',
	rdp: 'na',
};

export const onConsentChange = (): void => {
	consentTargeting.cmp_interaction = 'something here';
};

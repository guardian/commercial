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
let notSureTargeting: NotSureTargeting;

// Always the same for a single page view. Comes from the server?
// AVAILABLE: instantly
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
let contentTargeting: ContentTargeting;

// Experiments / Platform
// AVAILABLE: instantly
type ServerTargeting = {
	ab: string[];
	dcre: True | False; // DotCom-Rendering Eligible
	rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
	su: string; // SUrging article
};
let serverTargeting: ServerTargeting;

// User / Browser / PageView. Cookies + localStorage
// AVAILABLE: quickly
type VisitorTargeting = {
	af: 't'; // Ad Free
	amtgrp: AdManagerGroup;
	at: string; // Ad Test
	cc: CountryCode; // Country Code
	fr: Frequency; // FRequency
	permutive: string[]; // does this include the current page view?
	pv: string; // ophan Page View id
	ref: string; // REFerrer
	si: True | False; // Signed In
};
let visitorTargeting: VisitorTargeting;

// AVAILABLE: quickly + may change
type ViewportTargeting = Partial<{
	bp: 'mobile' | 'tablet' | 'desktop'; // BreakPoint
	inskin: True | False; // InSkin
	skinsize: 'l' | 's';
}>;
let viewportTargeting: ViewportTargeting;

// AVAILABLE: slowly + may change
type ConsentTargeting = {
	cmp_interaction?: string; // predefined? 'cmpuseraction' and others
	consent_tcfv2: True | False | NotApplicable;
	pa: True | False; // Personalised Ads consent
	rdp: True | False | NotApplicable;
};
const consentTargeting: ConsentTargeting = {
	pa: 'f',
	consent_tcfv2: 'na',
	rdp: 'na',
};

export type PageTargeting = NotSureTargeting &
	ContentTargeting &
	ServerTargeting &
	VisitorTargeting &
	ViewportTargeting &
	ConsentTargeting;

export const onViewportChange = (): void => {
	viewportTargeting.bp = 'desktop'; // something or other

	triggerCallbacks();
};

export const onConsentChange = (): void => {
	consentTargeting.cmp_interaction = 'something here';

	// TODO: update consentTargeting
	triggerCallbacks();
};

// const buildPageTargeting = (partial: Partial<PageTargeting>): PageTargeting => {
// 	return {
// 		...notSureTargeting,
// 		...contentTargeting,
// 		...serverTargeting,
// 		...visitorTargeting,
// 		...viewportTargeting,
// 		...consentTargeting,
// 		...partial.notSureTargeting,
// 		...partial.contentTargeting,
// 		...partial.serverTargeting,
// 		...partial.visitorTargeting,
// 		...partial.viewportTargeting,
// 		...partial.consentTargeting,
// 	};
// };

type Callback = (targeting: Promise<PageTargeting>) => void;
const callbacks: Callback[] = [];

const triggerCallbacks = (): void => {
	const pageTargeting = {
		...notSureTargeting,
		...contentTargeting,
		...serverTargeting,
		...visitorTargeting,
		...viewportTargeting,
		...consentTargeting,
	};

	callbacks.forEach((callback) => {
		callback(Promise.resolve(pageTargeting));
	});
};

triggerCallbacks();

export const onPageTargetingUpdate = (callback: Callback): void => {
	// do something

	callbacks.push(callback);
};

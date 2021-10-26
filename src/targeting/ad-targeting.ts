import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type { TCEventStatusCode } from '@guardian/consent-management-platform/dist/types/tcfv2';
import type { CountryCode } from '@guardian/libs';
import { storageWithConsent } from './storageWithConsent';

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
	/** Country Code */
	cc: CountryCode;
	/** FRequency */
	fr: Frequency;
	permutive: string[]; // does this include the current page view?
	/** ophan  Page View id */
	pv: string;
	/** REFerrer */
	ref: string;
	/** Signed In */
	si: True | False;
};
let visitorTargeting: VisitorTargeting;

// AVAILABLE: quickly + may change
type ViewportTargeting = Partial<{
	/** BreakPoint */
	bp: 'mobile' | 'tablet' | 'desktop';
	inskin: True | False;
	/** Large or Small, used for InSkin page skins */
	skinsize: 'l' | 's';
}>;
let viewportTargeting: ViewportTargeting;

// AVAILABLE: slowly + may change
type ConsentTargeting = {
	cmp_interaction?: TCEventStatusCode;
	/** Consented to all 10 purposes */
	consent_tcfv2: True | False | NotApplicable;
	/** Personalised Ads */
	pa: True | False;
	/** Restrict Data Processing */
	rdp: True | False | NotApplicable;
};
const consentTargeting: ConsentTargeting = {
	pa: 'f',
	consent_tcfv2: 'na',
	rdp: 'na',
};

export type AdTargeting = NotSureTargeting &
	ContentTargeting &
	ServerTargeting &
	VisitorTargeting &
	ViewportTargeting &
	ConsentTargeting;

/* --  Methods to get specfic targeting  -- */

const findBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
	if (width >= 980) return 'desktop';
	if (width >= 740) return 'tablet';
	return 'mobile';
};

const getFrequencyValue = (state: ConsentState): Frequency => {
	const rawValue = storageWithConsent.getRaw('gu.alreadyVisited', state);
	if (!rawValue) return '0';

	const visitCount: number = parseInt(rawValue, 10);

	if (visitCount <= 5) {
		return frequency[visitCount] ?? '0';
	} else if (visitCount >= 6 && visitCount <= 9) {
		return '6-9';
	} else if (visitCount >= 10 && visitCount <= 15) {
		return '10-15';
	} else if (visitCount >= 16 && visitCount <= 19) {
		return '16-19';
	} else if (visitCount >= 20 && visitCount <= 29) {
		return '20-29';
	} else if (visitCount >= 30) {
		return '30plus';
	}

	return '0';
};

/* -- Update Targeting on Specific Events -- */

const onViewportChange = async (): Promise<void> => {
	const width = window.innerWidth;
	// const height = window.innerHeight;

	viewportTargeting.bp = findBreakpoint(width);
	viewportTargeting.skinsize = width >= 1560 ? 'l' : 's';

	// Don’t show inskin if if a privacy message will be shown
	viewportTargeting.inskin = (await cmp.willShowPrivacyMessage()) ? 'f' : 't';

	triggerCallbacks();
};
window.addEventListener('resize', () => {
	void onViewportChange();
});

// TODO: Check if visitorTargeting needs updating

onConsentChange((state) => {
	if (state.tcfv2) {
		consentTargeting.cmp_interaction = state.tcfv2.eventStatus;
		consentTargeting.pa =
			Object.keys(state.tcfv2.consents).length > 0 &&
			Object.values(state.tcfv2.consents).every(Boolean)
				? 't'
				: 'f';
	}

	visitorTargeting.fr = getFrequencyValue(state);

	// TODO: update consentTargeting
	triggerCallbacks();
});

type Callback = (targeting: Promise<AdTargeting>) => void;
const callbacks: Callback[] = [];

const triggerCallbacks = (): void => {
	const adTargeting = {
		...notSureTargeting,
		...contentTargeting,
		...serverTargeting,
		...visitorTargeting,
		...viewportTargeting,
		...consentTargeting,
	};

	callbacks.forEach((callback) => {
		callback(Promise.resolve(adTargeting));
	});
};

export const onAdTargetingUpdate = (callback: Callback): void => {
	// do something

	callbacks.push(callback);
};

import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
import type {
	TCEventStatusCode,
	TCFv2ConsentList,
} from '@guardian/consent-management-platform/dist/types/tcfv2';
import type { CountryCode } from '@guardian/libs';
import { storageWithConsent } from '../lib/storage-with-consent';

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
let resolveNotSureTargetingReady: () => void;
const notSureTargetingReady = new Promise<void>((resolve) => {
	resolveNotSureTargetingReady = resolve;
});
const setNotSureTargeting = (newNotSureTargeting: NotSureTargeting) => {
	notSureTargeting = newNotSureTargeting;
	resolveNotSureTargetingReady();
};

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
let contentTargeting: Promise<ContentTargeting>;

// Experiments / Platform
// AVAILABLE: instantly
type ServerTargeting = {
	ab: string[];
	dcre: True | False; // DotCom-Rendering Eligible
	rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
	su: string; // SUrging article
};
let serverTargeting: Promise<ServerTargeting>;

// User / Browser / PageView. Cookies + localStorage
// AVAILABLE: quickly
type VisitorTargeting = {
	/** Ad ManagemenT GRouP */
	amtgrp: AdManagerGroup;
	at: string; // Ad Test
	/** Country Code */
	cc: CountryCode;
	/** FRequency */
	fr: Frequency;
	/** Permutive user segments */
	permutive: string[];
	/** ophan Page View id */
	pv: string;
	/** REFerrer */
	ref: string;
	/** Signed In */
	si: True | False;
};
let visitorTargeting: Promise<VisitorTargeting>;

// AVAILABLE: quickly + may change
type ViewportTargeting = {
	/** BreakPoint */
	bp: 'mobile' | 'tablet' | 'desktop';
	/** Whether InSkin page skins can run. Australia-specific. */
	inskin: True | False;
	/** Skin size: Large or Small. Used for InSkin page skins */
	skinsize: 'l' | 's';
};
let viewportTargeting: Promise<ViewportTargeting>;

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
let consentTargeting: Promise<ConsentTargeting> = Promise.resolve({
	pa: 'f',
	consent_tcfv2: 'na',
	rdp: 'na',
});

type AdFreeTargeting = {
	/** Ad Free */
	af: 't';
};

export type AdTargeting =
	| (NotSureTargeting &
			ContentTargeting &
			ServerTargeting &
			VisitorTargeting &
			ViewportTargeting &
			ConsentTargeting)
	| AdFreeTargeting;

/* --  Methods to get specific targeting  -- */

const findBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
	if (width >= 980) return 'desktop';
	if (width >= 740) return 'tablet';
	return 'mobile';
};

const getFrequencyValue = (state: ConsentState): Frequency => {
	const rawValue = storageWithConsent.getRaw('gu.alreadyVisited', state);
	if (!rawValue) return '0'; // TODO: should we return `null` instead?

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

	// Don’t show inskin if if a privacy message will be shown
	const inskin = (await cmp.willShowPrivacyMessage()) ? 'f' : 't';

	viewportTargeting = Promise.resolve({
		bp: findBreakpoint(width),
		skinsize: width >= 1560 ? 'l' : 's',
		inskin,
	});

	return triggerCallbacks();
};
window.addEventListener('resize', () => {
	void onViewportChange();
});

// TODO: Check if visitorTargeting needs updating

const tcfv2AllPurposesConsented = (consents: TCFv2ConsentList) =>
	Object.keys(consents).length > 0 && Object.values(consents).every(Boolean);
onConsentChange((state) => {
	if (state.tcfv2) {
		consentTargeting = Promise.resolve({
			cmp_interaction: state.tcfv2.eventStatus,
			pa: tcfv2AllPurposesConsented(state.tcfv2.consents) ? 't' : 'f',
			consent_tcfv2: tcfv2AllPurposesConsented(state.tcfv2.consents)
				? 't'
				: 'f',
			rdp: 'na',
		});
	}

	// @ts-expect-error -- we’re not finished!
	visitorTargeting = Promise.resolve({
		fr: getFrequencyValue(state),
	});

	// TODO: update consentTargeting
	void triggerCallbacks();
});

const init = () => {
	setNotSureTargeting({
		gdncrm: ['a', 'b', 'c'],
		ms: 'something',
		slot: 'top-above-nav',
		x: 'Krux-ID',
	});
};

init();

type Callback = (targeting: AdTargeting) => void | Promise<void>;
const callbacks: Callback[] = [];

const getAdTargeting = async (adFree: boolean): Promise<AdTargeting> => {
	if (adFree) {
		const adFreeTargeting: AdFreeTargeting = {
			af: 't',
		};
		return adFreeTargeting;
	}

	await Promise.all([notSureTargetingReady]);

	return {
		...notSureTargeting,
		...(await contentTargeting),
		...(await serverTargeting),
		...(await visitorTargeting),
		...(await viewportTargeting),
		...(await consentTargeting),
	};
};

const triggerCallbacks = async (): Promise<void> => {
	const adTargeting = await getAdTargeting(true);

	callbacks.forEach((callback) => {
		void callback(adTargeting);
	});
};

const onAdTargetingUpdate = (callback: Callback): void => {
	callbacks.push(callback);

	void triggerCallbacks();
};

export { onAdTargetingUpdate };

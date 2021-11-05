import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';
import type { NotSureTargeting } from './not-sure';
import { getUnsureTargeting, initUnsureTargeting } from './not-sure';
import type { PersonalisedTargeting } from './personalised';
import {
	getPersonalisedTargeting,
	updatePersonalisedTargeting,
} from './personalised';
import type { SessionTargeting } from './session';
import { getSessionTargeting, initSessionTargeting } from './session';

type True = 't';
type False = 'f';
type NotApplicable = 'na';

// Experiments / Platform
// AVAILABLE: instantly
type ServerTargeting = {
	ab: string[];
	dcre: True | False; // DotCom-Rendering Eligible
	rp: 'dotcom-rendering' | 'dotcom-platform'; // Rendering Platform
	su: string; // SUrging article
};
let serverTargeting: Promise<ServerTargeting>;

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

type AdFreeTargeting = {
	/** Ad Free */
	af: 't';
};

export type AdTargeting =
	| (NotSureTargeting &
			ContentTargeting &
			ServerTargeting &
			SessionTargeting &
			ViewportTargeting &
			PersonalisedTargeting)
	| AdFreeTargeting;

/* --  Methods to get specific targeting  -- */

const findBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
	if (width >= 980) return 'desktop';
	if (width >= 740) return 'tablet';
	return 'mobile';
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

onConsentChange((state) => {
	updatePersonalisedTargeting(state);

	// TODO: update consentTargeting
	void triggerCallbacks();
});

const init = ({ unsure }: { unsure: NotSureTargeting }) => {
	initUnsureTargeting(unsure);
	initSessionTargeting();

	void triggerCallbacks();
};

// TODO: Use real values
init({
	unsure: {
		gdncrm: ['a', 'b', 'c'],
		ms: 'something',
		slot: 'top-above-nav',
		x: 'Krux-ID',
	},
});

type Callback = (targeting: AdTargeting) => void | Promise<void>;
const callbacks: Callback[] = [];

const getAdTargeting = async (adFree: boolean): Promise<AdTargeting> => {
	if (adFree) {
		const adFreeTargeting: AdFreeTargeting = {
			af: 't',
		};
		return adFreeTargeting;
	}

	return {
		...(await getUnsureTargeting()),
		...(await getContentTargeting()),
		...(await serverTargeting),
		...(await getSessionTargeting()),
		...(await viewportTargeting),
		...(await getPersonalisedTargeting()),
	};
};

const triggerCallbacks = async (): Promise<void> => {
	const adTargeting: AdTargeting = await getAdTargeting(false);

	callbacks.forEach((callback) => {
		void callback(adTargeting);
	});
};

const onAdTargetingUpdate = (callback: Callback): void => {
	callbacks.push(callback);

	void triggerCallbacks();
};

export { onAdTargetingUpdate };
export type { True, False, NotApplicable };

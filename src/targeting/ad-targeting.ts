import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type { ContentTargeting } from './content';
import { getContentTargeting, initContentTargeting } from './content';
import type { NotSureTargeting } from './not-sure';
import { getUnsureTargeting, initUnsureTargeting } from './not-sure';
import type { PersonalisedTargeting } from './personalised';
import {
	getPersonalisedTargeting,
	updatePersonalisedTargeting,
} from './personalised';
import type { AllParticipations, SessionTargeting } from './session';
import { getSessionTargeting, initSessionTargeting } from './session';
import type { ViewportTargeting } from './viewport';
import { getViewportTargeting, updateViewportTargeting } from './viewport';

type True = 't';
type False = 'f';
type NotApplicable = 'na';

type AdFreeTargeting = {
	/** Ad Free */
	af: 't';
};

export type AdTargeting =
	| (NotSureTargeting &
			ContentTargeting &
			SessionTargeting &
			ViewportTargeting &
			PersonalisedTargeting)
	| AdFreeTargeting;

/* -- Update Targeting on Specific Events -- */

window.addEventListener('resize', () => {
	void cmp
		// If we’ll show a privacy banner, we can’t have page skins
		.willShowPrivacyMessage()
		.then((cmpBannerWillShow) => updateViewportTargeting(cmpBannerWillShow))
		.then(() => triggerCallbacks());
});

onConsentChange((state) => {
	updatePersonalisedTargeting(state);

	// TODO: update consentTargeting
	void triggerCallbacks();
});

const init = ({
	unsure,
	content,
	session,
	participations,
}: {
	unsure: NotSureTargeting;
	content: ContentTargeting;
	session: SessionTargeting;
	participations: AllParticipations;
}) => {
	initUnsureTargeting(unsure);
	initContentTargeting(content);
	initSessionTargeting(participations, session);

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
	content: {
		bl: ['a', 'b'],
		br: 'f',
		co: ['Max Duval'],
		ct: 'article',
		dcre: 'f',
		edition: 'uk',
		k: ['a', 'b'],
		ob: null,
		p: 'ng',
		rp: 'dotcom-platform',
		s: 'uk-news',
		se: ['one'],
		sens: 'f',
		su: '0',
		tn: 'something',
		url: '/some/thing',
		urlkw: ['a', 'b'],
		vl: '60',
	},
	session: {
		at: null,
		cc: 'GB',
		pv: '123457',
		si: 'f',
	},
	participations: {
		clientSideParticipations: {
			'ab-new-ad-targeting': {
				variant: 'variant',
			},
		},
		serverSideParticipations: {},
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
		...(await getSessionTargeting()),
		...(await getViewportTargeting()),
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

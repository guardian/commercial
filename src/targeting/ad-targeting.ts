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
}): void => {
	initUnsureTargeting(unsure);
	initContentTargeting(content);
	initSessionTargeting(participations, session);

	void triggerCallbacks();
};

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

	void getAdTargeting(false)
		.then((targeting) => callback(targeting))
		.catch(() => {
			// do nothing, callback will be trigger when Ad Targeting changes
		});
};

export { onAdTargetingUpdate, init };
export type { True, False, NotApplicable };

import { cmp, onConsentChange } from '@guardian/consent-management-platform';
import type { AdFreeTargeting } from './ad-free';
import { getAdFreeTargeting, updateAdFreeTargeting } from './ad-free';
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

type AdTargeting =
	| (NotSureTargeting &
			ContentTargeting &
			SessionTargeting &
			ViewportTargeting &
			PersonalisedTargeting)
	| AdFreeTargeting;

const registerListeners = () => {
	// TODO: Add throttling / debouncing
	window.addEventListener('resize', () => {
		void cmp
			// If we’ll show a privacy banner, we can’t have page skins
			.willShowPrivacyMessage()
			.then((cmpBannerWillShow) =>
				updateViewportTargeting(cmpBannerWillShow),
			)
			.then((count) => {
				if (count > 1) void triggerCallbacks();
			});
	});

	onConsentChange((state) => {
		const count = updatePersonalisedTargeting(state);

		if (count > 1) void triggerCallbacks();
	});
};

let initialised = false;
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
	if (initialised) return;
	else initialised = true;

	registerListeners();

	initUnsureTargeting(unsure);
	initContentTargeting(content);
	initSessionTargeting(participations, session);

	// TODO Allow this to be set, maybe asynchronously?
	updateAdFreeTargeting(false);
};

type Callback = (targeting: AdTargeting) => void | Promise<void>;
const callbacks: Callback[] = [];

const getAdTargeting = async (): Promise<AdTargeting> => {
	const adFreeTargeting = await getAdFreeTargeting();

	if (adFreeTargeting.af) return adFreeTargeting;

	return {
		...(await getUnsureTargeting()),
		...(await getContentTargeting()),
		...(await getSessionTargeting()),
		...(await getViewportTargeting()),
		...(await getPersonalisedTargeting()),
	};
};

const triggerCallbacks = async (): Promise<void> => {
	const adTargeting: AdTargeting = await getAdTargeting();

	callbacks.forEach((callback) => {
		void callback(adTargeting);
	});
};

const onAdTargetingUpdate = async (callback: Callback): Promise<void> => {
	callbacks.push(callback);

	const targeting = await getAdTargeting();
	return callback(targeting);
};

export { onAdTargetingUpdate, init };
export type { AdTargeting, True, False, NotApplicable };

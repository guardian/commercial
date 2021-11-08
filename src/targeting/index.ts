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

type InitAdTargeting = (targeting: {
	unsure: NotSureTargeting;
	content: ContentTargeting;
	session: SessionTargeting;
	participations: AllParticipations;
}) => void;
let initialised = false;
const init: InitAdTargeting = ({
	unsure,
	content,
	session,
	participations,
}) => {
	if (initialised) return;
	else initialised = true;

	registerListeners();

	initUnsureTargeting(unsure);
	initContentTargeting(content);
	initSessionTargeting(participations, session);

	// TODO Allow this to be set, maybe asynchronously?
	updateAdFreeTargeting(false);
};

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

type AdTargetingCallback = (targeting: AdTargeting) => void | Promise<void>;
const callbacks: AdTargetingCallback[] = [];
const triggerCallbacks = async (): Promise<void> => {
	const adTargeting: AdTargeting = await getAdTargeting();

	callbacks.forEach((callback) => {
		void callback(adTargeting);
	});
};

const onUpdate = async (callback: AdTargetingCallback): Promise<void> => {
	callbacks.push(callback);

	const targeting = await getAdTargeting();
	return callback(targeting);
};

// Ad Targeting methods are registered globally on the window
window.guardian.commercial ||= {};

/**
 * Initialise Ad Targeting
 *
 * Some initial values are required for targeting to work.
 * See type `InitAdTargeting` for details.
 *
 * Ad Targeting updates can be registered to via `onAdTargetingUpdate`.
 *
 */
const initAdTargeting: InitAdTargeting =
	(window.guardian.commercial.initAdTargeting ||= init);

/**
 * Register callbacks to execute when Ad Targeting changes.
 *
 * Safe to call before `initAdTargeting`.
 *
 * This is inherently asynchronous and could change during a page lifecycle
 * if events such as the following occur:
 * - Changes to a user’s privacy settings
 * - Changes to the browser window size
 * - Changes to logged-in status (?)
 */
const onAdTargetingUpdate = (window.guardian.commercial.onAdTargetingUpdate ||=
	onUpdate);

export { onAdTargetingUpdate, initAdTargeting };
export type {
	AdTargeting,
	AdTargetingCallback,
	InitAdTargeting,
	True,
	False,
	NotApplicable,
};

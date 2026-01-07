import { hashEmailForClient } from '@guardian/commercial-core';
import { loadScript, log } from '@guardian/libs';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
import type { UserId } from '../types';

const ATS_PLACEMENT_ID = 14522;

const ID_COOKIE_EXPIRY_DAYS = 15;

const ID_COOKIE_STORAGE_NAME = 'idl_env';

const SCRIPT_BUNDLE_URL =
	'https://launchpad.privacymanager.io/latest/launchpad.bundle.js';

const SCRIPT_LAUNCHPAD_URL =
	'https://launchpad-wrapper.privacymanager.io/3a17d559-73d2-4f0d-aff1-54da33303144/launchpad-liveramp.js';

const THIRTY_MINS_IN_SECONDS = 1800;

const loadBundle = () => {
	const link = document.createElement('link');
	link.as = 'script';
	link.rel = 'preload';
	link.href = SCRIPT_BUNDLE_URL;
	document.head.appendChild(link);
};

// Store hashed email globally for envelope module use.
// This is non-deterministic but unavoidable so that the
// ready event can be listened for as early as possible.
let emailAsHash: string | undefined;

window.addEventListener('envelopeModuleReady', function () {
	if (emailAsHash === undefined) return;
	window.atsenvelopemodule?.setAdditionalData({
		type: 'emailHashes',
		id: [emailAsHash],
	});
});

const getLiveRampParams = async (email: string): Promise<UserId> => {
	// bundle must be loaded as link and in advance of
	// liveramp script in accordance with liveramp's docs
	loadBundle();

	// hash email and load liveramp script in parallel
	const hashEmail = hashEmailForClient(email, 'liveramp');
	const loadLaunchpad = loadScript(SCRIPT_LAUNCHPAD_URL, {
		async: true,
		defer: true,
	});

	await Promise.all([hashEmail, loadLaunchpad])
		.then(([hashedEmail]) => {
			emailAsHash = hashedEmail;
		})
		.catch((e: unknown) => {
			log('commercial', 'Error loading Liveramp scripts', e);
		});

	return {
		name: 'identityLink',
		params: {
			// ats placement id
			pid: ATS_PLACEMENT_ID,

			// If you want to generate a RampID based on a LiveRamp 3p cookie
			// (from a previous authentication) until ATS can generate a new
			// RampID, set this property to false.
			notUse3P: false,
		},
		storage: {
			type: 'cookie',
			name: ID_COOKIE_STORAGE_NAME,
			expires: ID_COOKIE_EXPIRY_DAYS,
			refreshInSeconds: THIRTY_MINS_IN_SECONDS,
		},
	};
};

export const getUserIdForLiveRamp = async (
	email: string | null,
): Promise<UserId | undefined> => {
	const isInTest = isUserInTestGroup(
		'commercial-user-module-liveramp',
		'variant',
	);

	if (email && isInTest) {
		const params = await getLiveRampParams(email);
		return params;
	}
};

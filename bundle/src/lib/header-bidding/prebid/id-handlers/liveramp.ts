import { hashEmailForClient } from '@guardian/commercial-core';
import { loadScript, log } from '@guardian/libs';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
import type { UserId } from '../types';

const ATS_PLACEMENT_ID = 14522;
const EXPIRY_DAYS = 15;
const STORAGE_NAME = 'idl_env';
const THIRTY_MINS_IN_SECONDS = 1800;

const scriptLoadProps = {
	async: true,
	defer: true,
};

const loadBundle = () => {
	return loadScript(
		'https://launchpad.privacymanager.io/latest/launchpad.bundle.js',
		scriptLoadProps,
	);
};

const loadLiveRamp = () => {
	// Note: This script depends on the bundle being loaded first
	return loadScript(
		'https://ats-wrapper.privacymanager.io/ats-modules/ee7e18b9-e61a-40ac-8501-2af11edb8ea8/ats.js', // pre-prod
		// 'https://launchpad-wrapper.privacymanager.io/3a17d559-73d2-4f0d-aff1-54da33303144/launchpad-liveramp.js',	// prod
		scriptLoadProps,
	);
};

const getLiveRampParams = async (email: string): Promise<UserId> => {
	await Promise.all([
		hashEmailForClient(email, 'liveramp'),
		loadBundle(),
		loadLiveRamp(),
	])
		.then(([hashedEmail]) => {
			window.addEventListener('envelopeModuleReady', function () {
				console.log('ready');
				window.ats.setAdditionalData({
					type: 'emailHashes',
					id: [hashedEmail],
				});
			});
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
			notUse3P: true,
		},
		storage: {
			type: 'cookie',
			name: STORAGE_NAME,
			expires: EXPIRY_DAYS,
			refreshInSeconds: THIRTY_MINS_IN_SECONDS,
		},
	};
};

export const getUserIdForLiveRamp = async (
	email: string | null,
): Promise<UserId | undefined> => {
	const isInTest = !isUserInTestGroup(
		'commercial-user-module-liveramp',
		'variant',
	);

	if (email && isInTest) {
		const params = await getLiveRampParams(email);
		return params;
	}
};

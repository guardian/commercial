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

// bundle must be loaded in advance of liveramp script
// and as a link in accordance with liveramp's guidance
const loadBundle = () => {
	const link = document.createElement('link');
	link.as = 'script';
	link.rel = 'preload';
	link.href =
		'https://launchpad.privacymanager.io/latest/launchpad.bundle.js';
	document.head.appendChild(link);
};

const loadLiveRamp = () => {
	return loadScript(
		'https://launchpad-wrapper.privacymanager.io/3a17d559-73d2-4f0d-aff1-54da33303144/launchpad-liveramp.js', // prod
		scriptLoadProps,
	);
};

const getLiveRampParams = async (email: string): Promise<UserId> => {
	console.warn('liveramp: getting params for email', email);
	window.addEventListener('envelopeModuleReady', function () {
		console.warn('liveramp: envelopeModuleReady ready again');
	});

	loadBundle();

	await Promise.all([hashEmailForClient(email, 'liveramp'), loadLiveRamp()])
		.then(([hashedEmail]) => {
			console.warn('liveramp: hashed email generated', hashedEmail);
			window.addEventListener('envelopeModuleReady', function () {
				console.warn('liveramp: envelopeModuleReady ready');
				window.atsenvelopemodule?.setAdditionalData({
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
			notUse3P: 'true',
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
	const isInTest = isUserInTestGroup(
		'commercial-user-module-liveramp',
		'variant',
	);

	if (isInTest) {
		const params = await getLiveRampParams(email ?? '');
		return params;
	}
};

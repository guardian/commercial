import { hashEmailForClient } from '@guardian/commercial-core';
import type { ConsentState } from '@guardian/libs';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
import type { UserId } from '../types';

type TradeDeskIdParams = {
	name: 'uid2' | 'euid';
	params: {
		emailHash: string;
		serverPublicKey: string;
		subscriptionId: string;
	};
};

const getTradeDeskIdParams = async (
	id: 'uid2' | 'euid',
	email: string,
): Promise<TradeDeskIdParams> => {
	const emailHash = await hashEmailForClient(email, id);
	if (id === 'uid2') {
		return {
			name: 'uid2',
			params: {
				serverPublicKey:
					'UID2-X-P-MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7MS+2jntlSNTDP65WBYaCLR/Wla8r3h9NkYtN73lNtbo7WT5LFIKSGnD0kERa8VG8bNJvZrQs2bCU0P8ZH4uaA==',
				subscriptionId: 'HhGv3vmQcS',
				emailHash,
			},
		};
	}
	return {
		name: 'euid',
		params: {
			serverPublicKey:
				'EUID-X-P-MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEyoVAEgz82CK4G25Y1wGUngy3g9o3kCpl5bWTtCAJAx5gpG4PvhEaTPWCRp+FVVAzvkocZ/1IUJ4wPoS/QdIe5w==',
			subscriptionId: 'SvB8xb94yD',
			emailHash,
		},
	};
};

export const getUserIdForTradeDesk = async (
	email: string | null,
	consentState: ConsentState,
): Promise<UserId | undefined> => {
	const isInTest = !isUserInTestGroup(
		'commercial-user-module-uid2',
		'variant',
	);
	const isValidFramework =
		consentState.framework &&
		['tcfv2', 'usnat'].includes(consentState.framework);

	if (email && isInTest && isValidFramework) {
		const idType = consentState.framework === 'tcfv2' ? 'euid' : 'uid2';
		const params = await getTradeDeskIdParams(idType, email);
		return params;
	}
};

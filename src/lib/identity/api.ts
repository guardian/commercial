import { getCookie } from '@guardian/libs';
import { mergeCalls } from 'lib/utils/async-call-merger';
import { mediator } from 'lib/utils/mediator';

// Types info coming from https://github.com/guardian/discussion-rendering/blob/fc14c26db73bfec8a04ff7a503ed9f90f1a1a8ad/src/types.ts

type IdentityUserFromCache = {
	dates: { accountCreatedDate: string };
	publicFields: {
		displayName: string;
	};
	statusFields: {
		userEmailValidated: boolean;
	};
	primaryEmailAddress: string;
	id: number;
	rawResponse: string;
} | null;

type IdentityUserIdentifiers = {
	id: string;
	brazeUuid: string;
	puzzleId: string;
	googleTagId: string;
};

let userFromCookieCache: IdentityUserFromCache = null;

const cookieName = 'GU_U';

const idApiRoot =
	window.guardian.config.page.idApiUrl ?? '/ID_API_ROOT_URL_NOT_FOUND';

mediator.emit('module:identity:api:loaded');

const decodeBase64 = (str: string): string =>
	decodeURIComponent(
		escape(
			window.atob(
				str.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '='),
			),
		),
	);

const getUserCookie = (): string | null => getCookie({ name: cookieName });

const getUserFromCookie = (): IdentityUserFromCache => {
	if (userFromCookieCache === null) {
		const cookieData = getUserCookie();
		let userData: string[] | null = null;

		if (cookieData) {
			userData = JSON.parse(
				decodeBase64(cookieData.split('.')[0]),
			) as string[];
		}
		if (userData && cookieData) {
			const displayName = decodeURIComponent(userData[2]);
			userFromCookieCache = {
				id: parseInt(userData[0], 10),
				primaryEmailAddress: userData[1], // not sure where this is stored now - not in the cookie any more
				publicFields: {
					displayName,
				},
				dates: { accountCreatedDate: userData[6] },
				statusFields: {
					userEmailValidated: Boolean(userData[7]),
				},
				rawResponse: cookieData,
			};
		}
	}

	return userFromCookieCache;
};

const isUserLoggedIn = (): boolean => getUserFromCookie() !== null;

const fetchUserIdentifiers = () => {
	const url = `${idApiRoot}/user/me/identifiers`;
	return fetch(url, {
		mode: 'cors',
		credentials: 'include',
	})
		.then((resp) => {
			if (resp.status === 200) {
				return resp.json();
			} else {
				console.log(
					'failed to get Identity user identifiers',
					resp.status,
				);
				return null;
			}
		})
		.catch((e) => {
			console.log('failed to get Identity user identifiers', e);
			return null;
		});
};

const getUserIdentifiersFromApi = mergeCalls(
	(mergingCallback: (u: IdentityUserIdentifiers | null) => void) => {
		if (isUserLoggedIn()) {
			void fetchUserIdentifiers().then((result) =>
				mergingCallback(result),
			);
		} else {
			mergingCallback(null);
		}
	},
);

export { getUserIdentifiersFromApi, isUserLoggedIn };

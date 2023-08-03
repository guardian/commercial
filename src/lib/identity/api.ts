import type {
	AccessToken,
	AccessTokenClaims,
	IDToken,
} from '@guardian/identity-auth';
import { getCookie } from '@guardian/libs';
import { mergeCalls } from 'lib/utils/async-call-merger';
import { mediator } from 'lib/utils/mediator';
import type { CustomIdTokenClaims } from './okta';

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

type SignedOutWithCookies = { kind: 'SignedOutWithCookies' };
type SignedInWithCookies = { kind: 'SignedInWithCookies' };
type SignedOutWithOkta = { kind: 'SignedOutWithOkta' };
type SignedInWithOkta = {
	kind: 'SignedInWithOkta';
	accessToken: AccessToken<AccessTokenClaims>;
	idToken: IDToken<CustomIdTokenClaims>;
};

type AuthStatus =
	| SignedOutWithCookies
	| SignedInWithCookies
	| SignedOutWithOkta
	| SignedInWithOkta;

let userFromCookieCache: IdentityUserFromCache = null;

// We want to be in the experiment if in the development environment
// or if we have opted in to the Okta server side experiment
const isInOktaExperiment =
	window.guardian.config.page.stage === 'DEV' ||
	window.guardian.config.tests?.oktaVariant === 'variant';

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

const isUserLoggedIn = (): boolean => getUserFromCookie() !== null;

const getAuthStatus = async (): Promise<AuthStatus> => {
	if (isInOktaExperiment) {
		const { isSignedInWithOktaAuthState } = await import('./okta');
		const authState = await isSignedInWithOktaAuthState();
		if (authState.isAuthenticated) {
			return {
				kind: 'SignedInWithOkta',
				accessToken: authState.accessToken,
				idToken: authState.idToken,
			};
		} else {
			return {
				kind: 'SignedOutWithOkta',
			};
		}
	} else {
		if (isUserLoggedIn()) {
			return {
				kind: 'SignedInWithCookies',
			};
		} else {
			return {
				kind: 'SignedOutWithCookies',
			};
		}
	}
};

const isUserLoggedInOktaRefactor = (): Promise<boolean> =>
	getAuthStatus().then((authStatus) =>
		authStatus.kind === 'SignedInWithCookies' ||
		authStatus.kind === 'SignedInWithOkta'
			? true
			: false,
	);

/**
 * Decide request options based on an {@link AuthStatus}. Requests to authenticated APIs require different options depending on whether
 * you are in the Okta experiment or not.
 * @param authStatus
 * @returns where `authStatus` is:
 *
 * `SignedInWithCookies`:
 * - set the `credentials` option to `"include"`
 *
 * `SignedInWithOkta`:
 * - set the `Authorization` header with a Bearer Access Token
 * - set the `X-GU-IS-OAUTH` header to `true`
 */
const getOptionsHeadersWithOkta = (
	authStatus: SignedInWithCookies | SignedInWithOkta,
): RequestInit => {
	if (authStatus.kind === 'SignedInWithCookies') {
		return {
			credentials: 'include',
		};
	}

	return {
		headers: {
			Authorization: `Bearer ${authStatus.accessToken.accessToken}`,
			'X-GU-IS-OAUTH': 'true',
		},
	};
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

export {
	getUserIdentifiersFromApi,
	isUserLoggedIn,
	getAuthStatus,
	getOptionsHeadersWithOkta,
	isUserLoggedInOktaRefactor,
};
export type { AuthStatus };

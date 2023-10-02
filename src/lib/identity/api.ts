import type {
	AccessToken,
	AccessTokenClaims,
	IDToken,
} from '@guardian/identity-auth';
import { getCookie } from '@guardian/libs';
import { mediator } from 'lib/utils/mediator';
import type { CustomIdTokenClaims } from '../../types/global';

// Types info coming from https://github.com/guardian/discussion-rendering/blob/fc14c26db73bfec8a04ff7a503ed9f90f1a1a8ad/src/types.ts

type IdentityUserFromCache = {
	dates: { accountCreatedDate: string };
	publicFields: {
		displayName: string;
	};
	statusFields: {
		userEmailValidated: boolean;
	};
	id: number;
	rawResponse: string;
} | null;

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

const useOkta = !!window.guardian.config.switches.okta;

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

		if (cookieData) {
			const userData = JSON.parse(
				decodeBase64(cookieData.split('.')[0] ?? ''),
			) as string[];

			const id = parseInt(userData[0] ?? '', 10);
			const displayName = decodeURIComponent(userData[2] ?? '');
			const accountCreatedDate = userData[6];
			const userEmailValidated = Boolean(userData[7]);

			if (id && accountCreatedDate) {
				userFromCookieCache = {
					id,
					publicFields: {
						displayName,
					},
					dates: { accountCreatedDate },
					statusFields: {
						userEmailValidated,
					},
					rawResponse: cookieData,
				};
			}
		}
	}

	return userFromCookieCache;
};

/**
 * Fetch the logged in user's Google Tag ID from IDAPI
 * @returns one of:
 * - string - the user's Google Tag ID
 * - null - if the request failed
 */
const fetchGoogleTagIdFromApi = (): Promise<string | null> =>
	fetch(`${idApiRoot}/user/me/identifiers`, {
		mode: 'cors',
		credentials: 'include',
	})
		.then((resp) => {
			if (resp.status === 200) {
				return resp.json() as Promise<{ googleTagId: string }>;
			}
			throw resp.status;
		})
		.then((json) => json.googleTagId)
		.catch((e) => {
			console.log('failed to get Identity user identifiers', e);
			return null;
		});

const isUserLoggedIn = (): boolean => getUserFromCookie() !== null;

const getAuthStatus = async (): Promise<AuthStatus> => {
	if (useOkta) {
		try {
			const { isSignedInWithOktaAuthState } = await import('./okta');
			const authState = await isSignedInWithOktaAuthState();
			if (authState.isAuthenticated) {
				return {
					kind: 'SignedInWithOkta',
					accessToken: authState.accessToken,
					idToken: authState.idToken,
				};
			}
		} catch (e) {
			console.error(e);
		}

		return {
			kind: 'SignedOutWithOkta',
		};
	}
	if (isUserLoggedIn()) {
		return {
			kind: 'SignedInWithCookies',
		};
	}
	return {
		kind: 'SignedOutWithCookies',
	};
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

/**
 * Get the user's Google Tag ID
 *
 * If enrolled in the Okta experiment, return the value from the ID token
 * `google_tag_id` claim
 * Otherwise, fetch the Google Tag ID from IDAPI
 * @returns one of:
 * - string, if the user is enrolled in the Okta experiment or the fetch to
 *   IDAPI was successful
 * - null, if the user is signed out or the fetch to IDAPI failed
 */
const getGoogleTagId = (): Promise<string | null> =>
	getAuthStatus().then((authStatus) => {
		switch (authStatus.kind) {
			case 'SignedInWithCookies':
				return fetchGoogleTagIdFromApi();
			case 'SignedInWithOkta':
				return authStatus.idToken.claims.google_tag_id;
			default:
				return null;
		}
	});

export {
	isUserLoggedIn,
	getAuthStatus,
	getOptionsHeadersWithOkta,
	isUserLoggedInOktaRefactor,
	getGoogleTagId,
};
export type { AuthStatus };

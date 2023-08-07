import type {
	AccessToken,
	AccessTokenClaims,
	IDToken,
} from '@guardian/identity-auth';
import { getCookie } from '@guardian/libs';
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

/**
 * Fetch the logged in user's Google Tga ID from IDAPI
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
			} else {
				throw resp.status;
			}
		})
		.then((json) => json.googleTagId)
		.catch((e) => {
			console.log('failed to get Identity user identifiers', e);
			return null;
		});

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

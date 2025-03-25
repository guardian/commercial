import type {
	AccessToken,
	AccessTokenClaims,
	IDToken,
} from '@guardian/identity-auth';
import { getIdentityAuth } from '@guardian/identity-auth-frontend';
import type { CustomIdTokenClaims } from '../../types/global';

// Types info coming from https://github.com/guardian/discussion-rendering/blob/fc14c26db73bfec8a04ff7a503ed9f90f1a1a8ad/src/types.ts

type SignedOut = { kind: 'SignedOut' };
type SignedIn = {
	kind: 'SignedIn';
	accessToken: AccessToken<AccessTokenClaims>;
	idToken: IDToken<CustomIdTokenClaims>;
};

type AuthStatus = SignedOut | SignedIn;

const getAuthStatus = async (): Promise<AuthStatus> => {
	const { isAuthenticated, accessToken, idToken } =
		await getIdentityAuth().isSignedInWithAuthState();
	if (isAuthenticated) {
		return {
			kind: 'SignedIn',
			accessToken,
			idToken,
		};
	}
	return {
		kind: 'SignedOut',
	};
};

const isUserLoggedIn = (): Promise<boolean> => getIdentityAuth().isSignedIn();

/**
 * Get the user's Google Tag ID
 *
 * Returns the value from the ID token `google_tag_id` claim
 * @returns one of:
 * - string if the user signed in with Okta
 * - null if the user is signed out
 */
const getGoogleTagId = (): Promise<string | null> =>
	getAuthStatus().then((authStatus) =>
		authStatus.kind === 'SignedIn'
			? authStatus.idToken.claims.google_tag_id
			: null,
	);

export { getAuthStatus, isUserLoggedIn, getGoogleTagId };
export type { AuthStatus };

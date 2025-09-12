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
	console.log('🔐 getAuthStatus: Starting...');
	try {
		const { isAuthenticated, accessToken, idToken } =
			await getIdentityAuth().isSignedInWithAuthState();

		console.log('🔐 getAuthStatus: Raw auth state:', {
			isAuthenticated,
			hasAccessToken: !!accessToken,
			hasIdToken: !!idToken,
		});

		if (isAuthenticated) {
			console.log('🔐 getAuthStatus: User is authenticated');
			return {
				kind: 'SignedIn',
				accessToken,
				idToken,
			};
		}
		console.log('🔐 getAuthStatus: User is NOT authenticated');
		return {
			kind: 'SignedOut',
		};
	} catch (error) {
		console.error('❌ getAuthStatus: Error:', error);
		throw error;
	}
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

const getEmail = (): Promise<string | null> => {
	console.log('📧 getEmail: Starting...');
	return getAuthStatus().then((authStatus) => {
		console.log('📧 getEmail: Auth status:', authStatus.kind);
		if (authStatus.kind === 'SignedIn') {
			const email = authStatus.idToken.claims.email;
			console.log('📧 getEmail: Found email:', email ? 'YES' : 'NO');
			return email;
		}
		console.log('📧 getEmail: User not signed in, returning null');
		return null;
	});
};

const lazyFetchEmailWithTimeout = (): (() => Promise<string | null>) => () => {
	console.log('⏰ lazyFetchEmailWithTimeout: Starting timeout wrapper...');
	return new Promise((resolve) => {
		console.log('⏰ lazyFetchEmailWithTimeout: Setting 1s timeout...');
		setTimeout(() => {
			console.log(
				'⏰ lazyFetchEmailWithTimeout: Timeout reached, resolving with null',
			);
			resolve(null);
		}, 1000);

		console.log('⏰ lazyFetchEmailWithTimeout: Calling getEmail...');
		void getEmail().then((email) => {
			console.log(
				'⏰ lazyFetchEmailWithTimeout: getEmail resolved with:',
				email,
			);
			resolve(email ?? null);
		});
	});
};

export {
	getAuthStatus,
	isUserLoggedIn,
	getGoogleTagId,
	getEmail,
	lazyFetchEmailWithTimeout,
};
export type { AuthStatus };

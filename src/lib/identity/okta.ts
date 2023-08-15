import type {
	AccessTokenClaims,
	IdentityAuthState,
} from '@guardian/identity-auth';
import { getIdentityAuth } from '@guardian/identity-auth-frontend';
import type { CustomIdTokenClaims } from '../../types/global';

export async function isSignedInWithOktaAuthState(): Promise<
	IdentityAuthState<AccessTokenClaims, CustomIdTokenClaims>
> {
	return getIdentityAuth().isSignedInWithAuthState();
}

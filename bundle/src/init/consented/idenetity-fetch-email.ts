import { onConsent } from '@guardian/libs';
import type { ConsentState } from '@guardian/libs';
import {
	isUserLoggedIn,
	lazyFetchEmailWithTimeout,
} from '../../lib/identity/api';

export const init = async (): Promise<void> => {
	console.log('🚀 Identity Email Fetcher: Starting...');

	try {
		console.log('⏳ Waiting for consent...');
		const consentState: ConsentState = await onConsent();
		console.log('✅ Consent received!');
		console.log(`CMP Test Module: ${JSON.stringify(consentState)}`);

		console.log('🔍 Starting email fetch...');
		const emailFetcher = lazyFetchEmailWithTimeout();
		console.log('🔍 Email fetcher created');

		const email = await emailFetcher();
		console.log('📧 Users Email:', email);
		console.log('🔍 Email type:', typeof email);

		const isSignedIn = await isUserLoggedIn();
		const status = isSignedIn ? 'Signed In ✅' : `NOT signed in ❎`;
		console.log(status);
	} catch (error) {
		console.error('❌ Error in identity fetcher:', error);
	}

	console.log('🏁 Identity Email Fetcher: Complete');
};

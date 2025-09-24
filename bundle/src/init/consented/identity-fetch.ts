import { type ConsentState, onConsent } from '@guardian/libs';
import { getEmail } from '../../lib/identity/api';
import { hashEmailForId5 } from '../../lib/utils/crypto';

export const init = async (): Promise<string | null> => {
	console.log(`Idenetity Fetch working 📨`);
	try {
		const consentState: ConsentState = await onConsent();

		if (!consentState.canTarget) {
			console.log('❌ No consent for targeting - skipping email fetch');
			return null;
		}

		const email = await getEmail();

		if (email) {
			const hashedEmail = await hashEmailForId5(email);
			console.log(`ID5 Hashed Email: ${hashedEmail}`);
			return hashedEmail;
		}

		return null;
	} catch (error) {
		console.error('❌ Error in identity fetcher:', error);
		return null;
	}
};

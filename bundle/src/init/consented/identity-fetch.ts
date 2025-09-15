import { type ConsentState, onConsent } from '@guardian/libs';
import { getEmail } from '../../lib/identity/api';
import { sha256 } from '../../lib/utils/crypto';

export const init = async (): Promise<void> => {
	console.log(`Idenetity Fetch working 📨`);
	try {
		const consentState: ConsentState = await onConsent();
		console.log(
			`Consent framework: ${consentState.framework}, canTarget: ${consentState.canTarget}`,
		);

		if (!consentState.canTarget) {
			console.log('❌ No consent for targeting - skipping email fetch');
			return;
		}

		const email = await getEmail();

		if (email) {
			const hashedEmail = await sha256(email);
			console.log(`Hashed Email: ${hashedEmail}`);
		}
		console.log(`Email: ${email}`);
	} catch (error) {
		console.error('❌ Error in identity fetcher:', error);
	}

	console.log('🏁 Identity Email Fetcher: Complete');
};

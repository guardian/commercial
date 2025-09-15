import { getEmail } from '../../lib/identity/api';

export const init = async (): Promise<void> => {
	console.log(`Idenetity Fetch working 📨`);
	try {
		const email = await getEmail();

		console.log(`Email: ${email}`);
	} catch (error) {
		console.error('❌ Error in identity fetcher:', error);
	}

	console.log('🏁 Identity Email Fetcher: Complete');
};

type HashClient = 'id5' | 'uid2' | 'euid';

function toHex(hashBuffer: ArrayBuffer): string {
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((bytes) => bytes.toString(16).padStart(2, '0'))
		.join('');
	return hashHex;
}

function toBase64(hashBuffer: ArrayBuffer): string {
	const hashBytes = new Uint8Array(hashBuffer);
	const base64Hash = btoa(String.fromCharCode(...hashBytes));

	return base64Hash;
}

function normaliseEmail(email: string) {
	const normalisedEmail = email.trim().toLowerCase();
	const emailSuffix = normalisedEmail.split('@')[1];
	const emailLocal = normalisedEmail.split('@')[0];
	if (emailSuffix != 'gmail.com') {
		return normalisedEmail;
	}
	const strippedLocal = emailLocal?.replaceAll('.', '');
	return strippedLocal + '@' + emailSuffix;
}

async function hashEmailForClient(
	email: string,
	client: HashClient,
): Promise<string> {
	const normalisedEmail = normaliseEmail(email);
	console.log(`HERE: OG: ${email} hashed::: ${normalisedEmail}`)
	const utf8 = new TextEncoder().encode(normalisedEmail);
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
	switch (client) {
		case 'id5':
			return toHex(hashBuffer);
		case 'uid2':
		case 'euid':
			return toBase64(hashBuffer);
	}
}
export { hashEmailForClient, normaliseEmail };

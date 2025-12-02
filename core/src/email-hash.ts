type HashType = 'id5' | 'uid2';

function hashEmailHex(hashBuffer: ArrayBuffer): string {
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((bytes) => bytes.toString(16).padStart(2, '0'))
		.join('');
	return hashHex;
}

function hashEmailBase64(hashBuffer: ArrayBuffer): string {
	const hashBytes = new Uint8Array(hashBuffer);
	const base64Hash = btoa(String.fromCharCode(...hashBytes));

	return base64Hash;
}

async function hashEmail(email: string, hashType: HashType): Promise<string> {
	const normalisedEmail = email.trim().toLowerCase();
	const utf8 = new TextEncoder().encode(normalisedEmail);
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
	if (hashType === 'id5') {
		return hashEmailHex(hashBuffer);
	}
	return hashEmailBase64(hashBuffer);
}

export { hashEmail };

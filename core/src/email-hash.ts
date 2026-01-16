type HashClient = 'euid' | 'id5' | 'liveramp' | 'uid2';

function toBase64(content: ArrayBuffer): string {
	const hashBytes = new Uint8Array(content);
	const base64Hash = btoa(String.fromCharCode(...hashBytes));
	return base64Hash;
}

function toHex(content: ArrayBuffer): string {
	const hashArray = Array.from(new Uint8Array(content));
	const hashHex = hashArray
		.map((bytes) => bytes.toString(16).padStart(2, '0'))
		.join('');
	return hashHex;
}

function toString(content: ArrayBuffer): string {
	return new TextDecoder().decode(content);
}

async function hashEmailForClient(
	email: string,
	client: HashClient,
): Promise<string> {
	const normalisedEmail = email.trim().toLowerCase();
	const encodedEmail = new TextEncoder().encode(normalisedEmail);
	const emailAsSha256 = await crypto.subtle.digest('SHA-256', encodedEmail);
	switch (client) {
		case 'euid':
		case 'uid2':
			return toBase64(emailAsSha256);
		case 'id5':
			return toHex(emailAsSha256);
		case 'liveramp':
			return toString(emailAsSha256);
	}
}
export { hashEmailForClient };

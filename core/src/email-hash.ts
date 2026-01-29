type HashClient = 'euid' | 'id5' | 'liveramp' | 'uid2';
type Email = `${string}@${string}`;

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

function normaliseEmail(email: string): Email {
	const normalisedEmail = email.trim().toLowerCase();
	const [name, domain] = normalisedEmail.split('@');
	if (domain !== 'gmail.com') {
		return `${name}@${domain}`;
	}
	const strippedLocal = name?.replaceAll('.', '');
	return `${strippedLocal}@${domain}`;
}

async function hashEmailForClient(
	email: string,
	client: HashClient,
): Promise<string> {
	const normalisedEmail = normaliseEmail(email);
	const textAsBuffer = new TextEncoder().encode(normalisedEmail);
	const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
	switch (client) {
		case 'euid':
		case 'uid2':
			return toBase64(hashBuffer);
		case 'id5':
		case 'liveramp':
			return toHex(hashBuffer);
	}
}
export { hashEmailForClient, normaliseEmail };

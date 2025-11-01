async function sha256(string: string) {
	const utf8 = new TextEncoder().encode(string);
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((bytes) => bytes.toString(16).padStart(2, '0'))
		.join('');
	return hashHex;
}

function normaliseEmail(email: string) {
	let normalised = email.toLowerCase().trim();
	if (normalised.includes('@gmail')) {
		const [local] = normalised.split('@');
		const withoutAlias = local?.split('+')[0];
		normalised = `${withoutAlias}@gmail.com`;
	}
	return normalised;
}

function hashEmailForId5(email: string) {
	const normalisedEmail = normaliseEmail(email);
	return sha256(normalisedEmail);
}

export { hashEmailForId5 };

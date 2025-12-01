async function hashEmailHex(email: string) {
	const normalisedEmail = email.trim().toLowerCase();
	const utf8 = new TextEncoder().encode(normalisedEmail);
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8); //good
	const hashArray = Array.from(new Uint8Array(hashBuffer)); //Array.from converts it into a normal JS array of numbers [180, 201, 162, 137, 50, ...]
	const hashHex = hashArray
		.map((bytes) => bytes.toString(16).padStart(2, '0'))
		.join('');
	return hashHex;
}
async function hashEmailBase64(email: string) {
	const normalisedEmail = email.trim().toLowerCase();
	const utf8 = new TextEncoder().encode(normalisedEmail);
	const hashBuffer = await crypto.subtle.digest('SHA-256', utf8); // raw bytes
	const hashBytes = new Uint8Array(hashBuffer); // raw bytes as Uint8Array
	const base64Hash = btoa(String.fromCharCode(...hashBytes)); // Base64-encoded hash

	return base64Hash;
}

export { hashEmailHex, hashEmailBase64 };

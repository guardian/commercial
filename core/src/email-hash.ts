import SHA256 from 'crypto-js/sha256';

export function hashEmailForId5(email: string) {
	return SHA256(email).toString();
}

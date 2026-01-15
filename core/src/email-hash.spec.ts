import { hashEmailForClient, normaliseEmail } from './email-hash';

describe('hashEmail: ID5 client', () => {
	it('returns a hex encoded email', async () => {
		const hashedEmail = await hashEmailForClient(
			'testGuardianUser@gmail.com',
			'id5',
		);
		expect(hashedEmail).toBe(
			'528f4e83dbdd916e811358e43518555f68229b1dc279b6b2cd3c480f68371e7d',
		);
	});
});

describe('hashEmail: UID2 client', () => {
	it('returns a base64 encoded email', async () => {
		const hashedEmail = await hashEmailForClient(
			'user@example.com',
			'uid2',
		);
		expect(hashedEmail).toBe(
			'tMmiiTI7IaAcPpQPFQ65uMVCWH8av9jw4cwf/F5HVRQ=',
		);
	});
});

describe('normaliseEmail', () => {
	it('trims whitespace and lowercases the email', () => {
		const normalisedEmail = normaliseEmail('  User@Example.com  ');
		expect(normalisedEmail).toBe('user@example.com');
	});
	it('removes "." from the local part of the email', () => {
		const normalisedEmail = normaliseEmail('guardian.user@gmail.com');
		expect(normalisedEmail).toBe('guardianuser@gmail.com');
	});
	it('keeps the "+" from the local part of the email', () => {
		const normalisedEmail = normaliseEmail('guardian+user@gmail.com');
		expect(normalisedEmail).toBe('guardian+user@gmail.com');
	});
});

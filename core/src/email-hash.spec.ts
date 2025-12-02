import { hashEmail } from './email-hash';

describe('hashEmailHex for ID5', () => {
	it('normalises and hashes an uppercase email', async () => {
		const hashedEmail = await hashEmail(
			'testGuardianUser@gmail.com',
			'id5',
		);
		expect(hashedEmail).toBe(
			'528f4e83dbdd916e811358e43518555f68229b1dc279b6b2cd3c480f68371e7d',
		);
	});
	it('normalises and hashes an uppercase email with leading and trailing whitespace', async () => {
		const hashedEmail = await hashEmail(
			'  testGuardianUser@gmail.com  ',
			'id5',
		);
		expect(hashedEmail).toBe(
			'528f4e83dbdd916e811358e43518555f68229b1dc279b6b2cd3c480f68371e7d',
		);
	});
	it('hashes an email with a mix of "+" and "." and surrounding whitespace', async () => {
		const hashedEmail = await hashEmail(
			'  guardian+user.local@gmail.com  ',
			'id5',
		);
		expect(hashedEmail).toEqual(
			'64c75391118cd72d85992cb7ef14d4a395e592f309e02c83d6186d2c8447fab7',
		);
	});
	it('returns the hash for an input with only spaces (empty string after normalisation)', async () => {
		const hashedEmail = await hashEmail('   ', 'id5');
		expect(hashedEmail).toEqual(
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
		);
	});
});

describe('hashEmailBase64 for UID2', () => {
	it('normalises and hashes an uppercase email', async () => {
		const hashedEmail = await hashEmail('User@Example.com', 'uid2');
		expect(hashedEmail).toBe(
			'tMmiiTI7IaAcPpQPFQ65uMVCWH8av9jw4cwf/F5HVRQ=',
		);
	});
	it('normalises and hashes an uppercase email with leading and trailing whitespace', async () => {
		const hashedEmail = await hashEmail('  User@Example.com  ', 'uid2');
		expect(hashedEmail).toBe(
			'tMmiiTI7IaAcPpQPFQ65uMVCWH8av9jw4cwf/F5HVRQ=',
		);
	});
	it('hashes an email with a mix of "+" and "." and surrounding whitespace', async () => {
		const hashedEmail = await hashEmail(
			'  guardian+user.local@gmail.com  ',
			'uid2',
		);
		expect(hashedEmail).toEqual(
			'ZMdTkRGM1y2FmSy37xTUo5XlkvMJ4CyD1hhtLIRH+rc=',
		);
	});
	it('returns the hash for an input with only spaces (empty string after normalisation)', async () => {
		const hashedEmail = await hashEmail('   ', 'uid2');
		expect(hashedEmail).toEqual(
			'47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
		);
	});
});

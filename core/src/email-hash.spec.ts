import { normalisedEmail } from './email-hash';

describe('test hashing of email', () => {
	it('should return correctly hashed email', () => {
		const mockEmail = 'guardianUser1@gmail.com';
		const hashedEmail = normalisedEmail(mockEmail);
		expect(hashedEmail).toEqual('guardianuser1@gmail.com');
	});

	it('should return correctly hashed email with a mix of "+" and "." and space around the email', () => {
		const mockEmail = '  guardian+user.local@gmail.com  ';
		const hashedEmail = normalisedEmail(mockEmail);
		expect(hashedEmail).toEqual('guardian+user.local@gmail.com');
	});

	it('should return empty string for input with only spaces', () => {
		const mockEmail = '   ';
		const hashedEmail = normalisedEmail(mockEmail);
		expect(hashedEmail).toEqual('');
	});

	it('should hash emails in a case sensitive way', () => {
		const mockEmail = 'GuardianUserLocal@gmail.com';
		const hashedEmail = normalisedEmail(mockEmail);
		expect(hashedEmail).toEqual('guardianuserlocal@gmail.com');
	});
});

import { hashEmailForId5 } from './email-hash';

describe('test hashing of email', () => {
	it('should return correctly hashed email', () => {
		const mockEmail = 'guardianUser1@gmail.com';
		const hashedEmail = hashEmailForId5(mockEmail);
		expect(hashedEmail).toEqual(
			'2b848438a88e73be0ee84c721ce1347dc891f2b7ff827d08406e462b45b6ce9e',
		);
	});
	it('should return correctly hashed email with "." (ASCII code 46)', () => {
		const mockEmail = 'guardian.user@gmail.com';
		const hashedEmail = hashEmailForId5(mockEmail);
		expect(hashedEmail).toEqual(
			'fc95a6f72814dba8b5190dffb530ce5b77fb720867688dc9f05fdc55f4bb7f09',
		);
	});
	it('should return correctly hashed email "+" (ASCII code 43)', () => {
		const mockEmail = 'guardian+user@gmail.com';
		const hashedEmail = hashEmailForId5(mockEmail);
		expect(hashedEmail).toEqual(
			'63bb75401f268f45b5245a3d988512919ea5bc4cd70509dd0b4458062a13782c',
		);
	});
	it('should return correctly hashed email with a mix of "+" and "."', () => {
		const mockEmail = 'guardian+user.local@gmail.com';
		const hashedEmail = hashEmailForId5(mockEmail);
		expect(hashedEmail).toEqual(
			'64c75391118cd72d85992cb7ef14d4a395e592f309e02c83d6186d2c8447fab7',
		);
	});
	it('should hash emials in a case sensitive way', () => {
		const mockEmail = 'GuardianUserLocal@gmail.com';
		const hashedEmail = hashEmailForId5(mockEmail);
		expect(hashedEmail).toEqual(
			'1522956557177ce97b2663328a0991ee12b664446eb9c9b275758b0d5ab0a215',
		);
	});
});

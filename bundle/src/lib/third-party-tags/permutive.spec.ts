import { permutive } from './permutive';

describe('permutive', () => {
	it('should construct permutive with correct params', () => {
		expect(permutive({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			url: '//cdn.permutive.com/d6691a17-6fdb-4d26-85d6-b3dd27f55f08-web.js',
			name: 'permutive',
		});
	});
});

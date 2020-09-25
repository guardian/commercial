import { permutive } from './permutive';

describe('index', () => {
	it('should use the feature swtich option', () => {
		expect(permutive({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			url: '//cdn.permutive.com/d6691a17-6fdb-4d26-85d6-b3dd27f55f08-web.js',
			sourcepointId: '5eff0d77969bfa03746427eb',
		});
	});
});

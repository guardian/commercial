import { ias } from './ias';

describe('index', () => {
	it('should use the feature swtich option', () => {
		expect(ias({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			url: '//cdn.adsafeprotected.com/iasPET.1.js',
			name: 'ias',
		});
	});
});

import { ias } from './ias';

describe('ias', () => {
	it('should use the feature switch option', () => {
		expect(ias({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			url: '//cdn.adsafeprotected.com/iasPET.1.js',
			name: 'ias',
		});
	});
});

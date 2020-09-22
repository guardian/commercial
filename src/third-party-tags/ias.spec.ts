import { ias } from './ias';

describe('index', () => {
	it('should use the feature swtich option', () => {
		expect(ias({ featureSwitch: true })).toStrictEqual({
			shouldRun: true,
			url: '//cdn.adsafeprotected.com/iasPET.1.js',
			sourcepointId: '5e7ced57b8e05c485246ccf3',
		});
	});
});

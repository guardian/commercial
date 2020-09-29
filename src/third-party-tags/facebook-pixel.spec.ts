import { fbPixel } from './facebook-pixel';

describe('fbPixel', () => {
	it('should use the feature swtich option', () => {
		expect(fbPixel({ shouldRun: true })).toStrictEqual({
			shouldRun: true,
			url:
				'https://www.facebook.com/tr?id=279880532344561&ev=PageView&noscript=1',
			name: 'fb',
			useImage: true,
		});
	});
});

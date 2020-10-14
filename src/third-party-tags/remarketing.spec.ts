import { remarketing } from './remarketing';

describe('remarketing', () => {
	it('should have expected properties', () => {
		const remarketingTag = remarketing({ shouldRun: true });
		expect(remarketingTag).toMatchObject({
			shouldRun: true,
			url: '//www.googleadservices.com/pagead/conversion_async.js',
			name: 'remarketing',
			onLoad: remarketingTag.onLoad,
		});
	});
});

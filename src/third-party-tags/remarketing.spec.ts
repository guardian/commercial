import { remarketing } from './remarketing';

describe('remarketing', () => {
	it('should use the feature switch option', () => {
		expect(remarketing({ shouldRun: true })).toBe(expect.objectContaining({
			shouldRun: true,
			url: '//www.googleadservices.com/pagead/conversion_async.js',
	        name: 'remarketing',
		}));
	});
});

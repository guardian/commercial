import { remarketing } from './remarketing';

describe('remarketing', () => {
	it('should have expected properties', () => {
		expect(remarketing({ shouldRun: true })).toMatchObject({
			shouldRun: true,
			url: '//www.googleadservices.com/pagead/conversion_async.js',
	        name: 'remarketing',
		});
	});
});

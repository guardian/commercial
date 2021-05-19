import { remarketing } from './remarketing';
import type { ThirdPartyTag } from '../types';

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

	it('should call google_trackConversion onLoad', () => {
		window.google_trackConversion = jest.fn();
		const remarketingTag: ThirdPartyTag = remarketing({ shouldRun: true });
		if (remarketingTag.onLoad) {
			remarketingTag.onLoad();
			expect(window.google_trackConversion).toHaveBeenCalled();
		}
	});
});

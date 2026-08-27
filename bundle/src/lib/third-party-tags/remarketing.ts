import type { GetThirdPartyTag } from '../types';

const onLoad = () => {
	window.google_trackConversion?.({
		google_conversion_id: 971225648,
		google_custom_params: window.google_tag_params,
		google_remarketing_only: true,
	});
};

/**
 * Google conversion tracking
 * https://support.google.com/google-ads/answer/6095821
 * @param  {} {shouldRun}
 */
export const remarketing: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//www.googleadservices.com/pagead/conversion_async.js',
	name: 'remarketing',
	onLoad,
});

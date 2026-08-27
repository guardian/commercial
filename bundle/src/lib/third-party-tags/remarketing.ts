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
 */
export const remarketing: ReturnType<GetThirdPartyTag> = {
	shouldRun: window.guardian.config.switches.remarketing ?? false,
	url: '//www.googleadservices.com/pagead/conversion_async.js',
	name: 'remarketing',
	onLoad,
}

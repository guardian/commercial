import { GetThirdPartyTag } from '../types';

const onLoad = () => {
	window.google_trackConversion({
		google_conversion_id: 971225648,
		google_custom_params: window.google_tag_params,
		google_remarketing_only: true,
	});
};

export const remarketing: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: '//www.googleadservices.com/pagead/conversion_async.js',
	name: 'remarketing',
	onLoad,
});

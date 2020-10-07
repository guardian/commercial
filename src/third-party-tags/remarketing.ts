import { GetThirdPartyTag } from '../types';

declare global {
	interface Window {
        google_trackConversion: any;
        google_tag_params: any;
	}
}

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

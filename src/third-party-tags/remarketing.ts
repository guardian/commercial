import { GetThirdPartyTag } from '../types';

type GoogleTagParams = unknown;
type GoogleTrackConversionObject = {
	google_conversion_id: number;
	google_custom_params: GoogleTagParams;
	google_remarketing_only: boolean;
};
declare global {
	interface Window {
		google_trackConversion: (arg0: GoogleTrackConversionObject) => void;
		google_tag_params: GoogleTagParams;
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

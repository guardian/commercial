import { GetThirdPartyTag } from '../types';

export const fbPixel: GetThirdPartyTag = ({
	shouldRun,
	facebookAccountId,
}) => ({
	shouldRun,
	url: `https://www.facebook.com/tr?id=${facebookAccountId}&ev=PageView&noscript=1`,
	name: 'fb',
	useImage: true,
});

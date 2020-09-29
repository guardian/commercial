import { GetThirdPartyTag } from '../types';

export const fbPixel: GetThirdPartyTag = ({
	shouldRun,
	facebookAccountId,
}) => ({
	shouldRun,
	url: `https://www.facebook.com/tr?id=${facebookAccountId}&ev=PageView&noscript=1`,
	sourcepointId: '5e7e1298b8e05c54a85c52d2',
	useImage: true,
});

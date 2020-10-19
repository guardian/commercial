import type { GetThirdPartyTag } from '../types';

export const fbPixel: GetThirdPartyTag = ({ shouldRun }) => ({
	shouldRun,
	url: `https://www.facebook.com/tr?id=279880532344561&ev=PageView&noscript=1`,
	name: 'fb',
	useImage: true,
});

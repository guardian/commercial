import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

const stage = getStage();

const blogs: GuPage[] = [
	{
		path: getTestUrl({
			stage,
			path: '/politics/live/2022/jan/31/uk-politics-live-omicron-nhs-workers-coronavirus-vaccines-no-10-sue-gray-report',
			type: 'liveblog',
		}),
		name: 'live-update',
	},
	{
		path: getTestUrl({
			stage,
			path: '/business/live/2023/nov/22/sam-altman-openai-return-jeremy-hunt-autumn-statement-tax-cuts-business-live',
			type: 'liveblog',
		}),
		name: 'under-ad-limit',
		expectedMinInlineSlotsOnDesktop: 4,
		expectedMinInlineSlotsOnMobile: 6,
	},
	{
		path: getTestUrl({
			stage,
			path: '/business/live/2023/aug/07/halifax-house-prices-gradual-drop-annual-fall-in-july-interest-rates-mortgages-business-live',
			type: 'liveblog',
		}),
		expectedMinInlineSlotsOnDesktop: 5,
		expectedMinInlineSlotsOnMobile: 7,
	},
];

export { blogs };

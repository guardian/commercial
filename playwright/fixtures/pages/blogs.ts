import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

const stage = getStage();

const blogs: GuPage[] = [
	{
		path: getTestUrl(
			stage,
			'/politics/live/2022/jan/31/uk-politics-live-omicron-nhs-workers-coronavirus-vaccines-no-10-sue-gray-report',
			'liveblog',
		),
		name: 'live-update',
	},
	{
		path: getTestUrl(
			stage,
			'/football/live/2023/aug/08/carabao-cup-first-round-wrexham-v-wigan-gillingham-v-southampton-live',
			'liveblog',
		),
		name: 'ad-limit',
		expectedMinInlineSlotsOnDesktop: 5,
	},
	{
		path: getTestUrl(
			stage,
			'/business/live/2023/aug/07/halifax-house-prices-gradual-drop-annual-fall-in-july-interest-rates-mortgages-business-live',
			'liveblog',
		),
		expectedMinInlineSlotsOnDesktop: 4,
		expectedMinInlineSlotsOnMobile: 5,
	},
];

export { blogs };

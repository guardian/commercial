import type { GuPage } from './Page';

const blogs = [
	{
		path: '/Article/https://www.theguardian.com/politics/live/2022/jan/31/uk-politics-live-omicron-nhs-workers-coronavirus-vaccines-no-10-sue-gray-report',
		name: 'live-update',
	},
	{
		path: '/Article/https://www.theguardian.com/business/live/2023/nov/22/sam-altman-openai-return-jeremy-hunt-autumn-statement-tax-cuts-business-live',
		name: 'under-ad-limit',
		expectedMinInlineSlots: {
			desktop: 4,
			tablet: 4,
			mobile: 6,
		},
	},
	{
		path: '/Article/https://www.theguardian.com/business/live/2023/aug/07/halifax-house-prices-gradual-drop-annual-fall-in-july-interest-rates-mortgages-business-live',
		expectedMinInlineSlots: {
			desktop: 5,
			tablet: 5,
			mobile: 7,
		},
	},
] as const satisfies GuPage[];

export { blogs };

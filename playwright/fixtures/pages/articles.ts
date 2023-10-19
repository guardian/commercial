import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

const stage = getStage();

const articles: GuPage[] = [
	{
		path: getTestUrl({
			stage,
			path: '/politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/sport/2022/feb/10/team-gb-winter-olympic-struggles-go-on-with-problems-for-skeleton-crew',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/environment/2020/oct/13/maverick-rewilders-endangered-species-extinction-conservation-uk-wildlife',
		}),
		name: 'inlineSlots',
		expectedMinInlineSlotsOnDesktop: 11,
		expectedMinInlineSlotsOnMobile: 16,
	},
	{
		path: getTestUrl({
			stage,
			path: '/society/2020/aug/13/disabled-wont-receive-critical-care-covid-terrifying',
		}),
		name: 'sensitive-content',
	},
	{
		path: getTestUrl({
			stage,
			path: '/politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
			type: 'article',
			adtest: 'comdev',
		}),
	},
];

export { articles };

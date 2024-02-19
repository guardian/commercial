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
			path: '/football/2024/feb/09/premier-league-10-things-to-look-out-for-this-weekend',
		}),
		name: 'inlineSlots',
		// Array.from(document.querySelectorAll('.article-body-commercial-selector > *')).map((el, index) => el.classList.contains('ad-slot-container') ? index : undefined).filter((index) => index !== undefined)
		expectedSlotIndicesOnMobile: [6, 18, 24, 30, 48],
		expectedSlotIndicesOnDesktop: [14, 30, 43, 55],
	},
	{
		path: getTestUrl({
			stage,
			path: '/culture/2024/feb/08/say-it-with-a-kiss-the-20-greatest-smooches-on-film-ranked',
		}),
		name: 'inlineSlots',
		expectedSlotIndicesOnMobile: [4, 11, 18, 25, 32, 39, 46, 53, 57, 64],
		expectedSlotIndicesOnDesktop: [6, 13, 20, 30, 37, 44, 51, 58, 65],
	},
];

export { articles };

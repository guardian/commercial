import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

const stage = getStage();

/**
 * To get expectedSlotPositionsOnMobile and expectedSlotPositionsOnDesktop, run the following in the browser console:
 * Array.from(document.querySelectorAll('.article-body-commercial-selector > *')).map((el, index) => el.classList.contains('ad-slot-container') ? index : undefined).filter((index) => index !== undefined)
 *
 * Make sure that you are on the same viewport size as the test you are trying to update.
 **/
const articles = [
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
		expectedMinInlineSlots: {
			desktop: 11,
			tablet: 18,
			mobile: 16,
		},
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
		expectedSlotPositions: {
			mobile: [7, 14, 20, 26, 32, 39, 46, 58],
			tablet: [7, 14, 25, 37, 44, 56],
			desktop: [14, 30, 43, 55],
		},
	},
	{
		path: getTestUrl({
			stage,
			path: '/culture/2024/feb/08/say-it-with-a-kiss-the-20-greatest-smooches-on-film-ranked',
		}),
		name: 'inlineSlots',
		expectedSlotPositions: {
			mobile: [4, 11, 18, 25, 32, 39, 46, 53, 57, 64],
			tablet: [4, 11, 18, 25, 32, 39, 46, 53, 60, 67],
			desktop: [6, 13, 20, 30, 37, 44, 51, 58, 65],
		},
	},
] as const satisfies GuPage[];

export { articles };

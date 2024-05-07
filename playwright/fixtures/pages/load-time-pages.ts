import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

const stage = getStage();

const loadTimePages: GuPage[] = [
	{
		path: getTestUrl({
			stage,
			path: '/sport/2024/mar/25/jasmin-paris-interview-barkley-marathons-ultramarathon-history',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/food/2023/oct/04/how-to-make-the-perfect-marmite-spaghetti-recipe-felicity-cloake-comfort-food',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/travel/2024/apr/12/readers-favourite-trips-to-scandinavia-sweden-norway-denmark',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/science/2024/mar/31/can-you-solve-it-best-pub-quiz-questions-ever',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/commentisfree/2022/oct/27/we-can-go-to-the-moon-so-why-cant-we-stop-my-glasses-sliding-down-my-nose',
		}),
	},
];

export { loadTimePages };

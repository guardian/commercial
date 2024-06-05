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
	{
		path: getTestUrl({
			stage,
			path: '/books/2022/jul/18/tomorrow-and-tomorrow-and-tomorrow-by-gabrielle-zevin-review-when-game-boy-meets-game-girl',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/culture/2018/jan/25/the-20-greatest-oscar-snubs-ever-ranked',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/lifeandstyle/2023/sep/29/21-things-ive-learned-about-skin-care-sali-hughes',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/lifeandstyle/2024/apr/21/favourite-flowers-and-moles-making-merry',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/science/2024/feb/23/quantum-physics-microscopic-gravity-discovery',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/commentisfree/2024/may/01/vote-for-my-friend-sadiq-khan-dont-let-toxic-incompetent-tory-rule-ruin-london',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/books/2024/may/01/what-were-reading-writers-and-readers-on-the-books-they-enjoyed-in-april',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/travel/2024/may/01/its-not-the-zambezi-but-the-tweed-has-its-moments-canoeing-in-the-scottish-borders',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/sport/2024/apr/13/emma-raducanu-leads-gb-to-bjk-cup-finals-with-stunning-win-over-france',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/commentisfree/2024/apr/30/rishi-sunak-lead-tories-local-elections-regicide-as-usual',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/australia-news/2024/may/01/after-25-years-logging-and-bushfires-a-greater-glider-has-been-spotted-in-deongwar-state-forest',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/business/2024/apr/29/ireland-reaps-700m-brexit-bonanza-from-customs-duties',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/games/2020/mar/16/animal-crossing-new-horizons-review-nintendo-switch',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/money/2024/apr/29/meal-prepping-is-booming-but-beware-the-health-dangers',
		}),
	},
	{
		path: getTestUrl({
			stage,
			path: '/technology/2024/apr/30/amazon-sales-report-ai',
		}),
	},
];

export { loadTimePages };

import type { GuPage } from './Page';

type Front = GuPage & {
	section: string;
};

type TagPage = GuPage;

const fronts = [
	{
		// path: getTestUrl({
		// 	path: '/uk',
		// 	type: 'front',
		// 	adtest: 'fixed-puppies',
		// }),
		path: '/Front/https://www.theguardian.com/uk',
		section: 'uk',
	},
	{
		// path: getTestUrl({
		// 	path: '/uk/commentisfree',
		// 	type: 'front',
		// 	adtest: 'fixed-puppies',
		// }),
		path: '/Front/https://www.theguardian.com/uk/commentisfree',
		section: 'commentisfree',
	},
	{
		// path: getTestUrl({
		// 	path: '/uk/sport',
		// 	type: 'front',
		// 	adtest: 'fixed-puppies',
		// }),
		path: '/Front/https://www.theguardian.com/uk/sport',
		section: 'sport',
	},
] as const satisfies Front[];

const tagPages = [
	{
		// path: getTestUrl({
		// 	path: '/tone/recipes/all',
		// 	type: 'tagPage',
		// 	adtest: 'fixed-puppies',
		// }),
		path: '/TagPage/https://www.theguardian.com/tone/recipes/all',
	},
] as const satisfies TagPage[];

const frontWithPageSkin = {
	// path: getTestUrl({
	// 	path: '/uk',
	// 	type: 'front',
	// 	adtest: 'puppies-pageskin',
	// }),
	path: '/Front/https://www.theguardian.com/uk',
	section: 'uk',
} as const satisfies Front;

const frontWithExclusion = {
	// path: getTestUrl({
	// 	path: '/us-news/baltimore-bridge-collapse',
	// 	type: 'tagPage',
	// 	adtest: 'clear',
	// }),
	path: '/Front/https://www.theguardian.com/us-news/baltimore-bridge-collapse',
	section: 'us-news',
} as const satisfies Front;

export { fronts, frontWithExclusion, frontWithPageSkin, tagPages };

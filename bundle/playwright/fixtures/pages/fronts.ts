import { getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

type Front = GuPage & {
	section: string;
};

type TagPage = GuPage;

const fronts = [
	{
		path: getTestUrl({
			path: '/uk',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'uk',
	},
	{
		path: getTestUrl({
			path: '/uk/commentisfree',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'commentisfree',
	},
	{
		path: getTestUrl({
			path: '/uk/sport',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'sport',
	},
] as const satisfies Front[];

const tagPages = [
	{
		path: getTestUrl({
			path: '/tone/recipes/all',
			type: 'tagPage',
			adtest: 'fixed-puppies',
		}),
	},
] as const satisfies TagPage[];

const frontWithPageSkin = {
	path: getTestUrl({
		path: '/uk',
		type: 'front',
		adtest: 'puppies-pageskin',
	}),
	section: 'uk',
} as const satisfies Front;

const frontWithExclusion = {
	path: getTestUrl({
		path: '/us-news/baltimore-bridge-collapse',
		type: 'tagPage',
		adtest: 'clear',
	}),
	section: 'us-news',
} as const satisfies Front;

export { fronts, frontWithExclusion, frontWithPageSkin, tagPages };

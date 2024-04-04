import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

type Front = GuPage & {
	section: string;
};

type TagPage = GuPage;

const stage = getStage();

const fronts: Front[] = [
	{
		path: getTestUrl({
			stage,
			path: '/uk',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'uk',
	},
	{
		path: getTestUrl({
			stage,
			path: '/uk/commentisfree',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'commentisfree',
	},
	{
		path: getTestUrl({
			stage,
			path: '/uk/sport',
			type: 'front',
			adtest: 'fixed-puppies',
		}),
		section: 'sport',
	},
];

const tagPages: TagPage[] = [
	{
		path: getTestUrl({
			stage,
			path: '/world/americas',
			type: 'tagPage',
			adtest: 'fixed-puppies',
		}),
	},
];

const frontWithPageSkin: Front = {
	path: getTestUrl({
		stage,
		path: '/uk',
		type: 'front',
		adtest: 'puppies-pageskin',
	}),
	section: 'uk',
};

// This is a tag front, not supported by DCR yet, we can use prod and
const frontWithExclusion: Front = {
	path: getTestUrl({
		stage,
		path: '/us-news/baltimore-bridge-collapse',
		type: 'tagPage',
		adtest: 'clear',
	}),
	section: 'us-news',
};

export { frontWithPageSkin, fronts, tagPages, frontWithExclusion };

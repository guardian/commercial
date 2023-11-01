import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

type Front = GuPage & {
	section: string;
};

type TaggedFront = GuPage;

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

const taggedFronts: TaggedFront[] = [
	{
		path: getTestUrl({
			stage,
			path: '/world/americas', // tagged front
			type: 'taggedFront',
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

export { frontWithPageSkin, fronts, taggedFronts };

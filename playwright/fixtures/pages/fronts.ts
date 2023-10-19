import { getStage, getTestUrl } from '../../lib/util';
import type { GuPage } from './Page';

type Front = GuPage & {
	section: string;
};

const stage = getStage();

const fronts: Front[] = [
	{
		path: getTestUrl({
			stage,
			path: '/uk',
			type: 'front',
			adtest: 'puppies-pageskin',
		}),
		section: 'uk',
	},
	{
		path: getTestUrl({
			stage,
			path: '/commentisfree',
			type: 'front',
			adtest: 'puppies-pageskin',
		}),
		section: 'commentisfree',
	},
	{
		path: getTestUrl({
			stage,
			path: '/sport',
			type: 'front',
			adtest: 'puppies-pageskin',
		}),
		section: 'sport',
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

export { fronts, frontWithPageSkin };

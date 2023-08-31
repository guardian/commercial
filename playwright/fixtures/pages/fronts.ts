import { getStage, getTestUrl } from '../../lib/util';
import type { Page } from './Page';

type Front = Page & {
	section: string;
};

const stage = getStage();

const fronts: Front[] = [
	{
		path: getTestUrl(stage, '/uk', 'front', 'puppies-pageskin'),
		section: 'uk',
	},
	{
		path: getTestUrl(stage, '/commentisfree', 'front', 'puppies-pageskin'),
		section: 'commentisfree',
	},
	{
		path: getTestUrl(stage, '/sport', 'front', 'puppies-pageskin'),
		section: 'sport',
	},
];

const frontWithPageSkin: Front = {
	path: getTestUrl(stage, '/uk', 'front', 'puppies-pageskin'),
	section: 'uk',
};

export { fronts, frontWithPageSkin };

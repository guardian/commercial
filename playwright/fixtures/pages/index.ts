import { articles } from './articles';
import { fronts, frontWithPageSkin } from './fronts';
import { blogs } from './liveblogs';

const allPages = [...articles, ...blogs];

export { articles, blogs, fronts, frontWithPageSkin, allPages };

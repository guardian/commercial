import { fronts, frontWithPageSkin } from './fronts';
import { articles } from './articles';
import { liveblogs } from './liveblogs';

const allPages = [...articles, ...liveblogs];

export { articles, liveblogs, fronts, frontWithPageSkin, allPages };

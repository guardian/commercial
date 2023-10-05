import { articles } from './articles';
import { blogs } from './blogs';
import { fronts, frontWithPageSkin } from './fronts';

const allPages = [...articles, ...blogs];

export { articles, blogs, fronts, frontWithPageSkin, allPages };

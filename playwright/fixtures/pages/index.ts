import { articles } from './articles';
import { blogs } from './blogs';
import { fronts, frontWithPageSkin, tagFronts } from './fronts';

const allPages = [...articles, ...blogs];

export { allPages, articles, blogs, fronts, frontWithPageSkin, tagFronts };

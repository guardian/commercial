import { articles } from './articles';
import { blogs } from './blogs';
import { fronts, frontWithPageSkin, tagPages } from './fronts';

const allPages = [...articles, ...blogs];

export { allPages, articles, blogs, fronts, frontWithPageSkin, tagPages };

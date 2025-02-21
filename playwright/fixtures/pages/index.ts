import { articles } from './articles';
import { blogs } from './blogs';
import { fronts, frontWithPageSkin, tagPages } from './fronts';
import type { GuPage } from './Page';

const allPages = [...articles, ...blogs] satisfies GuPage[];

export { allPages, articles, blogs, fronts, frontWithPageSkin, tagPages };

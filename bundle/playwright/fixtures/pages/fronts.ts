import type { GuPage } from './Page';

const fronts = [
	{ path: '/Front/https://www.theguardian.com/uk' },
	{ path: '/Front/https://www.theguardian.com/uk/commentisfree' },
	{ path: '/Front/https://www.theguardian.com/uk/sport' },
] as const satisfies GuPage[];

const tagPages = [
	{ path: '/TagPage/https://www.theguardian.com/tone/recipes/all' },
] as const satisfies GuPage[];

const frontWithPageSkin = {
	path: '/Front/https://www.theguardian.com/uk',
} as const satisfies GuPage;

const frontWithExclusion = {
	path: '/TagPage/https://www.theguardian.com/us-news/baltimore-bridge-collapse',
} as const satisfies GuPage;

export { fronts, frontWithExclusion, frontWithPageSkin, tagPages };

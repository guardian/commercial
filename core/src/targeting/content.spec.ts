import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';
import type { SharedTargeting } from './shared';

const defaultValues: Parameters<typeof getContentTargeting>[0] = {
	path: '/2021/my-great-blog-post',
	sensitive: false,
	renderingPlatform: 'dotcom-platform',
	section: 'uk-news',
	eligibleForDCR: false,
};

describe('Content Targeting', () => {
	describe('Section (s)', () => {
		const sections: Array<ContentTargeting['s']> = [
			'uk-news',
			'environment',
			'culture',
		];
		test.each(sections)('Returns the correct section `%s`', (section) => {
			const expected: Pick<ContentTargeting, 's'> = {
				s: section,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				section,
			});

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Rendering Platform (rp)', () => {
		const platforms: Array<
			[
				Parameters<typeof getContentTargeting>[0]['renderingPlatform'],
				ContentTargeting['rp'],
			]
		> = [
			['dotcom-platform', 'dotcom-platform'],
			['dotcom-rendering', 'dotcom-rendering'],
		];

		test.each(platforms)(
			'For `%s` return the `%s`',
			(renderingPlatform) => {
				const expected: Pick<ContentTargeting, 'rp'> = {
					rp: renderingPlatform,
				};

				const targeting = getContentTargeting({
					...defaultValues,
					renderingPlatform,
				});

				expect(targeting).toMatchObject(expected);
			},
		);
	});

	describe('Eligible for DCR (dcre)', () => {
		const eligibilities: Array<[boolean, ContentTargeting['dcre']]> = [
			[true, 't'],
			[false, 'f'],
		];

		test.each(eligibilities)(
			'For `%s`, returns `%s`',
			(eligibleForDCR, dcre) => {
				const expected: Pick<ContentTargeting, 'dcre'> = {
					dcre,
				};

				const targeting = getContentTargeting({
					...defaultValues,
					eligibleForDCR,
				});

				expect(targeting).toMatchObject(expected);
			},
		);
	});

	describe('Video Length (vl)', () => {
		const videoLengths: Array<[number, ContentTargeting['vl']]> = [
			[10, '30'],
			[25, '30'],
			[30, '30'],

			[31, '60'],
			[59, '60'],
			[60, '60'],

			[90, '90'],
			[120, '120'],
			[150, '150'],
			[180, '180'],
			[210, '210'],
			[240, '240'],

			[300, '300'],
			[301, '300'],
			[999, '300'],

			[-999, null],
			[NaN, null],
		];

		test.each(videoLengths)('For `%f`, returns `%s`', (videoLength, vl) => {
			const expected: Partial<ContentTargeting> = {
				vl,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				videoLength,
			});

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Sensitive (sens)', () => {
		const sensitive: Array<[boolean, ContentTargeting['sens']]> = [
			[true, 't'],
			[false, 'f'],
		];

		test.each(sensitive)('For `%s`, returns `%s`', (sensitive, sens) => {
			const expected: Pick<ContentTargeting, 'sens'> = {
				sens,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				sensitive,
			});

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Path and its keywords (url and urlkw)', () => {
		test('Handles standard slug like /2021/nov/1/my-great-blog-post', () => {
			const path: SharedTargeting['url'] =
				'/2021/nov/1/my-great-blog-post';
			const keywords: ContentTargeting['urlkw'] = [
				'my',
				'great',
				'blog',
				'post',
			];

			const expected: Pick<ContentTargeting, 'urlkw'> = {
				urlkw: keywords,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				path,
			});

			expect(targeting).toMatchObject(expected);
		});

		test('Handles double dashes in slug', () => {
			const path: SharedTargeting['url'] =
				'/world/2021/nov/1/one--ring-2---rule-them-all';
			const keywords: ContentTargeting['urlkw'] = [
				'one',
				'ring',
				'2',
				'rule',
				'them',
				'all',
			];

			const expected: Pick<ContentTargeting, 'urlkw'> = {
				urlkw: keywords,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				path,
			});

			expect(targeting).toMatchObject(expected);
		});

		test('Handles no leading slash', () => {
			const path: SharedTargeting['url'] = '/2021/my-great-blog-post';
			const keywords: ContentTargeting['urlkw'] = [
				'my',
				'great',
				'blog',
				'post',
			];

			const expected: Pick<ContentTargeting, 'urlkw'> = {
				urlkw: keywords,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				path,
			});

			expect(targeting).toMatchObject(expected);
		});

		test('Handles weird URL ///', () => {
			const path: SharedTargeting['url'] = '///';
			const keywords: ContentTargeting['urlkw'] = [];

			const expected: Pick<ContentTargeting, 'urlkw'> = {
				urlkw: keywords,
			};

			const targeting = getContentTargeting({
				...defaultValues,
				path,
			});

			expect(targeting).toMatchObject(expected);
		});
	});
});

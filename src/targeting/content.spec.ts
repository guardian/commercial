import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';
import type { SharedTargeting } from './shared';

const defaultParams: Parameters<typeof getContentTargeting> = [
	{
		path: '/2021/my-great-blog-post',
		sensitive: false,
		renderingPlatform: 'dotcom-platform',
		section: 'uk-news',
		eligibleForDCR: false,
	},
];

const [defaultValues] = defaultParams;

describe('Content Targeting', () => {
	test('should output the same thing', () => {
		const expected: ContentTargeting = {
			dcre: 'f',
			rp: 'dotcom-platform',
			s: 'uk-news',
			sens: 'f',
			urlkw: ['some', 'thing', 'or', 'other'],
			vl: null,
		};

		const targeting = getContentTargeting({
			path: '/2021/some-thing-or-other',
			sensitive: false,
			renderingPlatform: 'dotcom-platform',
			eligibleForDCR: false,
			section: 'uk-news',
		});

		expect(targeting).toEqual(expected);
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

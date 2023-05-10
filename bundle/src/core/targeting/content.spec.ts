import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';
import type { SharedTargeting } from './shared';

const defaultValues: Parameters<typeof getContentTargeting>[0] = {
	path: '/2021/my-great-blog-post',
	sensitive: false,
	renderingPlatform: 'dotcom-platform',
	section: 'uk-news',
	eligibleForDCR: false,
	webPublicationDate: 608857200,
	keywords: ['keyword'],
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

	describe('Recently published content (rc)', () => {
		// Mock Date.now to return a fixed date
		Date.now = jest.fn(() =>
			new Date('January 1, 2023 00:00:00').getTime(),
		);

		test('correctly buckets content published 1 second ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'December 31, 2022 23:59:59',
					).getTime(),
				}),
			).toMatchObject({
				rc: '0',
			});
		});

		test('correctly buckets content published 6 hours ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'December 31, 2022 18:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '1',
			});
		});

		test('correctly buckets content published 2 days ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'December 30, 2022 00:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '2',
			});
		});

		test('correctly buckets content published 5 days ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'December 26, 2022 00:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '3',
			});
		});

		test('correctly buckets content published 2 weeks ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'December 18, 2022 00:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '4',
			});
		});

		test('correctly buckets content published 6 months ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'July 1, 2022 00:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '5',
			});
		});

		test('correctly buckets content published 12 months ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'January 1, 2022 00:00:00',
					).getTime(),
				}),
			).toMatchObject({
				rc: '6',
			});
		});

		test('correctly buckets content published 14 months and 1 second ago', () => {
			expect(
				getContentTargeting({
					...defaultValues,
					webPublicationDate: new Date(
						'October 31, 2021 23:59:59',
					).getTime(),
				}),
			).toMatchObject({
				rc: '7',
			});
		});
	});
});

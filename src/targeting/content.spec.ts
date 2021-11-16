import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';

const defaultParams: Parameters<typeof getContentTargeting> = [
	{
		path: '/2021/my-great-blog-post',
		contributors: ['Commercial Development'],
		contentType: 'article',
		platform: 'NextGen',
		sensitive: false,
		surging: 50,
		tones: ['minutebyminute'],
	},
	{
		bl: ['a', 'b'],
		dcre: 'f',
		edition: 'uk',
		k: ['a', 'b'],
		ob: null,
		rp: 'dotcom-platform',
		s: 'uk-news',
		se: ['one'],
	},
];

const [defaultValues, defaultTargeting] = defaultParams;

describe('Content Targeting', () => {
	test('should output the same thing', () => {
		const expected: ContentTargeting = {
			bl: ['a', 'b'],
			br: 'f',
			co: ['Commercial', 'Comm-Dev'],
			ct: 'article',
			dcre: 'f',
			edition: 'uk',
			k: ['a', 'b'],
			ob: null,
			p: 'ng',
			rp: 'dotcom-platform',
			s: 'uk-news',
			se: ['one'],
			sens: 'f',
			su: ['0'],
			tn: ['news'],
			url: '/2021/some-thing-or-other',
			urlkw: ['some', 'thing', 'or', 'other'],
			vl: null,
		};

		const targeting = getContentTargeting(
			{
				path: '/2021/some-thing-or-other',
				contributors: ['Commercial', 'Comm-Dev'],
				branding: 'Foundation',
				contentType: 'article',
				platform: 'NextGen',
				sensitive: false,
				tones: ['news'],
				surging: 0,
			},
			{
				bl: ['a', 'b'],
				dcre: 'f',
				edition: 'uk',
				k: ['a', 'b'],
				ob: null,
				rp: 'dotcom-platform',
				s: 'uk-news',
				se: ['one'],
			},
		);

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

			const targeting = getContentTargeting(
				{
					...defaultValues,
					videoLength,
				},
				defaultTargeting,
			);

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Sensitive', () => {
		const sensitive: Array<[boolean, ContentTargeting['sens']]> = [
			[true, 't'],
			[false, 'f'],
		];

		test.each(sensitive)('For `%s`, returns `%s`', (sensitive, sens) => {
			const expected: Pick<ContentTargeting, 'sens'> = {
				sens,
			};

			const targeting = getContentTargeting(
				{
					...defaultValues,
					sensitive,
				},
				defaultTargeting,
			);

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Sensitive', () => {
		const sensitive: Array<[boolean, ContentTargeting['sens']]> = [
			[true, 't'],
			[false, 'f'],
		];

		test.each(sensitive)('For `%s`, returns `%s`', (sensitive, sens) => {
			const expected: Pick<ContentTargeting, 'sens'> = {
				sens,
			};

			const targeting = getContentTargeting(
				{
					...defaultValues,
					sensitive,
				},
				defaultTargeting,
			);

			expect(targeting).toMatchObject(expected);
		});
	});

	describe('Surging', () => {
		const sensitive: Array<[number, ContentTargeting['su']]> = [
			[0, ['0']],
			[1, ['0']],
			[49, ['0']],

			[50, ['5']],
			[99, ['5']],

			[100, ['5', '4']],
			[199, ['5', '4']],

			[200, ['5', '4', '3']],
			[300, ['5', '4', '3', '2']],
			[400, ['5', '4', '3', '2', '1']],

			[1200, ['5', '4', '3', '2', '1']],

			[NaN, ['0']],
			[-999, ['0']],
		];

		test.each(sensitive)('For `%s`, returns `%s`', (surging, su) => {
			const expected: Pick<ContentTargeting, 'su'> = {
				su: su.sort(),
			};

			const targeting = getContentTargeting(
				{
					...defaultValues,
					surging,
				},
				defaultTargeting,
			);

			expect(targeting).toMatchObject(expected);
		});
	});
});

import type { ContentTargeting } from './content';
import { getContentTargeting } from './content';

describe('Content Targeting', () => {
	test('should output the same thing', () => {
		const content: ContentTargeting = {
			bl: ['a', 'b'],
			br: 'f',
			co: ['Max Duval'],
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
			su: '0',
			tn: 'something',
			url: '/some/thing',
			urlkw: ['a', 'b'],
			vl: '60',
		};

		expect(getContentTargeting(content)).toEqual(content);
	});

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
	test.each(videoLengths)('Video Length (vl) %f => %s', (videoLength, vl) => {
		const expected: Partial<ContentTargeting> = {
			vl,
		};

		const targeting = getContentTargeting(
			{
				bl: ['a', 'b'],
				br: 'f',
				co: ['Commercial Development'],
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
				su: '0',
				tn: 'something',
				url: '/some/thing',
				urlkw: ['a', 'b'],
			},
			videoLength,
		);

		expect(targeting).toMatchObject(expected);
	});
});

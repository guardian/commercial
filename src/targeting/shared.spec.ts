import type { SharedTargeting } from './shared';
import { _, getSharedTargeting } from './shared';

describe('Shared Targeting', () => {
	describe('What goes in comes out', () => {
		const targeting: SharedTargeting = {
			br: 'p',
			co: ['commercial-development'],
			bl: ['some-tag'],
			ct: 'article',
			edition: 'uk',
			k: ['a', 'b'],
			ob: 't',
			p: 'ng',
			se: ['one', 'two', 'three'],
			sh: `https://www.theguardian.com/p/123456`,
			su: ['1', '2', '3'],
			tn: ['minutebyminute'],
			url: '/world/2021/12/01/some-breaking-news',
		};

		expect(getSharedTargeting(targeting)).toEqual(targeting);
	});

	describe('Surging (su)', () => {
		const sensitive: Array<[number, SharedTargeting['su']]> = [
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
			const expected: SharedTargeting['su'] = su.slice().sort();

			const targeting = _.getSurgingParam(surging);

			expect(targeting).toMatchObject(expected);
		});
	});
});

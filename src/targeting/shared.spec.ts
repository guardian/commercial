import type { SharedTargeting } from './shared';
import { _ } from './shared';

describe('Shared Targeting', () => {
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

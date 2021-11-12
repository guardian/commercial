import type { UnsureTargeting } from './unsure';
import { getUnsureTargeting } from './unsure';

describe('Unsure targeting', () => {
	test('These should never really be used anyways', () => {
		const unsure: UnsureTargeting = {
			gdncrm: ['a', 'b', 'c'],
			ms: 'something',
			slot: 'top-above-nav',
			x: 'Krux-ID',
		};

		const targeting = getUnsureTargeting(unsure);
		expect(targeting).toMatchObject(unsure);
	});
});

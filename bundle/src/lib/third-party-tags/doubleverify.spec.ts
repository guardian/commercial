import { doubleVerify } from './doubleverify';
import { isDvActive } from './doubleverify-state';

describe('doubleVerify', () => {
	afterEach(() => {
		delete window.onDvtagReady;
	});

	it.each([true, false])('should preserve shouldRun: %s', (shouldRun) => {
		expect(doubleVerify({ shouldRun })).toMatchObject({
			shouldRun,
			url: '//pub.dv.tech/dvtag/27703429/DV2380005/pub.js',
			name: 'doubleVerify',
		});
	});

	it('should mark DV active and install the helper before loading', () => {
		expect(isDvActive()).toBe(false);
		expect(window.onDvtagReady).toBeUndefined();

		const tag = doubleVerify({ shouldRun: true });
		expect(tag.beforeLoad).toEqual(expect.any(Function));
		tag.beforeLoad?.();

		expect(isDvActive()).toBe(true);
		expect(window.onDvtagReady).toEqual(expect.any(Function));
	});
});

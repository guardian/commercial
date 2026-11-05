import { doubleVerify } from './doubleverify';

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

	it('should install the helper before loading', () => {
		expect(window.onDvtagReady).toBeUndefined();

		const tag = doubleVerify({ shouldRun: true });
		expect(tag.beforeLoad).toEqual(expect.any(Function));
		tag.beforeLoad?.();

		expect(window.onDvtagReady).toEqual(expect.any(Function));
	});
});

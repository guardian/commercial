import { doubleVerify } from './doubleverify';

describe('doubleVerify', () => {
	afterEach(() => {
		delete window.onDvtagReady;
	});

	it('should install the helper before loading', () => {
		expect(window.onDvtagReady).toBeUndefined();

		const tag = doubleVerify({ shouldRun: true });
		expect(tag.beforeLoad).toEqual(expect.any(Function));
		tag.beforeLoad?.();
		expect(window.onDvtagReady).toEqual(expect.any(Function));
	});

	it('should install the helper before loading', () => {
		expect(window.onDvtagReady).toBeUndefined();

		const tag = doubleVerify({ shouldRun: true });
		expect(tag.beforeLoad).toEqual(expect.any(Function));
		tag.beforeLoad?.();

		expect(window.onDvtagReady).toEqual(expect.any(Function));
	});
});

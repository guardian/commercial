import { canUseDom } from './can-use-dom';

describe('canUseDom', () => {
	const { window: oldWindow } = global;
	beforeEach(() => {
		global.window = oldWindow;
	});

	test('can use when detects window', () => {
		expect(canUseDom()).toBe(true);
	});

	test('can not use DOM when window is undefined', () => {
		Object.defineProperty(global, 'window', {
			configurable: true,
			enumerable: true,
			value: undefined,
			writable: true,
		});
		expect(canUseDom()).toBe(false);
	});

	test('can not use DOM when window.document is undefined', () => {
		Object.defineProperty(window, 'document', {
			configurable: true,
			enumerable: true,
			value: undefined,
			writable: true,
		});
		expect(canUseDom()).toBe(false);
	});

	test('can not use DOM when window.document.createElement is undefined', () => {
		Object.defineProperty(window, 'document', {
			configurable: true,
			enumerable: true,
			value: { createElement: undefined },
			writable: true,
		});
		expect(canUseDom()).toBe(false);
	});
});

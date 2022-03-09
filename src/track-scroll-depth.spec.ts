import { EventTimer } from './EventTimer';
import { initTrackScrollDepth } from './track-scroll-depth';

describe('initTrackScrollDepth', () => {
	const observe = jest.fn();
	class IntersectionObserver {
		constructor() {
			return Object.freeze({
				observe,
				unobserve: () => {
					return;
				},
			});
		}
	}

	const originalOffsetHeight = Object.getOwnPropertyDescriptor(
		HTMLElement.prototype,
		'offsetHeight',
	);
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
			configurable: true,
			value: 1000,
		});

		Object.defineProperty(global, 'IntersectionObserver', {
			value: IntersectionObserver,
			writable: true,
		});
	});

	afterAll(() => {
		Object.defineProperty(
			HTMLElement.prototype,
			'offsetHeight',
			originalOffsetHeight ?? 0,
		);
	});

	test('Hidden elements are inserted and observed', () => {
		// Given a 1000px page and a viewport height of 100px,
		// 10 hidden elements are inserted
		// NOTE we can't test the callback to IntersectionObserver
		// since IntersectionObserver isn't available and has to be mocked.
		const eventTimer = EventTimer.get();
		window.innerHeight = 100;

		initTrackScrollDepth();

		// height of viewport recorded
		expect(eventTimer.properties['pageHeightVH']).toEqual(10);
		const hiddenElements = document.querySelectorAll(
			'.scroll-depth-marker',
		);
		// the hidden elements are inserted
		expect(hiddenElements.length).toEqual(10);
		// and observed
		expect(observe).toHaveBeenCalledTimes(10);
	});
});

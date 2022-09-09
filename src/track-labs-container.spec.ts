import { EventTimer } from './event-timer';
import { initTrackLabsContainer } from './track-labs-container';

describe('initTrackLabsContainer', () => {
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

	beforeAll(() => {
		Object.defineProperty(global, 'IntersectionObserver', {
			value: IntersectionObserver,
			writable: true,
		});
	});

	test('When a labs container is not present on the page, observe is not called', () => {
		const eventTimer = EventTimer.get();

		initTrackLabsContainer();

		expect(eventTimer.properties['hasLabsContainer']).toBeUndefined();
		expect(observe).not.toHaveBeenCalled();
	});

	test('When a labs container is present on the page, observe is called', () => {
		const section = document.createElement('section');
		section.className = 'dumathoin';
		document.body.appendChild(section);

		const eventTimer = EventTimer.get();

		initTrackLabsContainer();

		expect(eventTimer.properties['hasLabsContainer']).toEqual(true);
		expect(observe).toHaveBeenCalledTimes(1);
	});
});

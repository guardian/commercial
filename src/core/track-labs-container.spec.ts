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
		expect(eventTimer.properties['labsUrl']).toBeUndefined();
		expect(observe).not.toHaveBeenCalled();
	});

	test('When a labs container is present on the page, the relevant properties are set and observe is called', () => {
		const section = document.createElement('section');
		section.className = 'dumathoin';
		document.body.appendChild(section);

		const title = document.createElement('h1');
		title.className = 'dumathoin__title';
		section.appendChild(title);

		const link = document.createElement('a');
		link.href = '/eat-more-potatoes';
		title.appendChild(link);

		const eventTimer = EventTimer.get();

		initTrackLabsContainer();

		expect(eventTimer.properties['hasLabsContainer']).toEqual(true);
		expect(eventTimer.properties['labsUrl']).toEqual('/eat-more-potatoes');
		expect(observe).toHaveBeenCalledTimes(1);
	});
});

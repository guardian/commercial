import { log } from '@guardian/libs';
import { EventTimer } from './event-timer';

/**
 * Collect commercial metrics on:
 * - whether the page contains a Guardian Labs container element (aka 'dumathoin'), and if so
 * - when the element is scrolled into view
 */
const initTrackLabsContainer = () => {
	const target = document.querySelector('section.dumathoin');
	if (target === null) return;

	const eventTimer = EventTimer.get();

	log('commercial', 'Page has labs container');
	eventTimer.properties['hasLabsContainer'] = true;

	const observer = new IntersectionObserver((entries) => {
		entries.map((entry) => {
			if (entry.isIntersecting) {
				log('commercial', 'Labs container in view');
				eventTimer.trigger('labsContainerInView');
				observer.unobserve(entry.target);
			}
		});
	});

	observer.observe(target);
};

export { initTrackLabsContainer };

import { log } from '@guardian/libs';
import { EventTimer, PageEvents } from './event-timer';

/**
 * Collect commercial metrics on:
 * - whether the page contains a Guardian Labs container element (aka 'dumathoin'), and if so
 * - when the element is scrolled into view
 */
const initTrackLabsContainer = () => {
	const target = document.querySelector('section.dumathoin');
	if (target === null) return;

	const labsUrl = document
		.querySelector('h1.dumathoin__title a')
		?.getAttribute('href');
	if (labsUrl === null) return;

	const eventTimer = EventTimer.get();

	log('commercial', 'Page has labs container');
	eventTimer.setProperty('hasLabsContainer', true);
	eventTimer.setProperty('labsUrl', labsUrl);

	const observer = new IntersectionObserver((entries) => {
		entries.map((entry) => {
			if (entry.isIntersecting) {
				log('commercial', 'Labs container in view');
				eventTimer.trigger(PageEvents.LabsContainerInView);
				observer.unobserve(entry.target);
			}
		});
	});

	observer.observe(target);
};

export { initTrackLabsContainer };

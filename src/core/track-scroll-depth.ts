import { log } from '@guardian/libs';
import { EventTimer } from './event-timer';

/**
 * Collect commercial metrics on scroll depth
 * Insert hidden elements at intervals of 1 viewport height
 * then use an intersection observer to mark the time when the viewport intersects with these elements.
 * Approach inspired by https://gist.github.com/bgreater/2412517f5a3f9c6fc4cafeb1ca71384f
 */
const initTrackScrollDepth = () => {
	const pageHeight = document.body.offsetHeight;
	const intViewportHeight = window.innerHeight;

	// this if statement is here to handle a bug in Firefox in Android where the innerHeight
	// of a new tab can be 0, so we end up dividing by 0 and looping through infinity
	if (intViewportHeight > 0) {
		// how many viewports tall is the page?
		const pageHeightVH = Math.floor(pageHeight / intViewportHeight);
		const eventTimer = EventTimer.get();
		eventTimer.setProperty('pageHeightVH', pageHeightVH);

		const observer = new IntersectionObserver(
			/* istanbul ignore next */
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const currentDepthVH = String(
							entry.target.getAttribute('data-depth'),
						);
						log(
							'commercial',
							`current scroll depth ${currentDepthVH}`,
						);
						eventTimer.mark(`scroll-depth-vh-${currentDepthVH}`);
						observer.unobserve(entry.target);
					}
				});
			},
		);

		for (let depth = 1; depth <= pageHeightVH; depth++) {
			const div = document.createElement('div');
			div.dataset.depth = String(depth);
			div.style.top = String(100 * depth) + '%';
			div.style.position = 'absolute';
			div.className = 'scroll-depth-marker';
			document.body.appendChild(div);
			observer.observe(div);
		}
	}
};

export { initTrackScrollDepth };

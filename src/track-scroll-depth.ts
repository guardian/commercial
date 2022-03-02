import { EventTimer } from './EventTimer';

/**
 * Collect commercial metrics on scroll depth
 * Insert hidden elements at intervals of 1 viewport height
 * then use an intersection observer to mark the time when the viewport intersects with these elements.
 */
const initTrackScrollDepth = () => {
	const body = document.querySelector('body');
	if (body === null) return;
	const pageHeight = body.offsetHeight;
	const intViewportHeight = window.innerHeight;
	// how many viewports tall is the page?
	const pageHeightVH = Math.floor(pageHeight / intViewportHeight);
	const eventTimer = EventTimer.get();
	eventTimer.setProperty('pageHeightVH', pageHeightVH);

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const currentDepthVH = entry.target.getAttribute('data-depth');
				console.log('current depth ', currentDepthVH);
				eventTimer.trigger('scroll-depth-vh-' + String(currentDepthVH));
				observer.unobserve(entry.target);
			}
		});
	});

	for (let depth = 1; depth <= pageHeightVH; depth++) {
		const div = document.createElement('div');
		div.dataset.depth = String(depth);
		div.style.top = String(100 * depth) + '%';
		div.style.position = 'absolute';
		body.appendChild(div);
		observer.observe(div);
	}
};

export { initTrackScrollDepth };

import fastdom from '../fastdom-promise';
import type { RegisterListener } from '../messenger';

type Respond = (...args: unknown[]) => void;

type Iframe = { node: HTMLIFrameElement; visible: boolean; respond: Respond };

// An intersection observer will allow us to efficiently send slot
// coordinates for only those that are in the viewport.
let taskQueued = false;
let iframes: Record<string, Iframe> = {};
let iframeCounter = 0;
let observer: IntersectionObserver | null;
let visibleIframeIds: string[] = [];

const reset = (): void => {
	taskQueued = false;
	iframes = {};
	iframeCounter = 0;
};

// Instances of classes bound to the current view are not serialised correctly
// by JSON.stringify. That's ok, we don't care if it's a DOMRect or some other
// object, as long as the calling view receives the frame coordinates.
const domRectToRect = (rect: DOMRect) => ({
	width: rect.width,
	height: rect.height,
	top: rect.top,
	bottom: rect.bottom,
	left: rect.left,
	right: rect.right,
});

const sendCoordinates = (iframeId: string, domRect: DOMRect) => {
	iframes[iframeId]?.respond(null, domRectToRect(domRect));
};

const getDimensions = (id: string): [string, DOMRect] => {
	const node = <HTMLIFrameElement>iframes[id]?.node;
	return [id, node.getBoundingClientRect()];
};

const onIntersect: IntersectionObserverCallback = (changes) => {
	visibleIframeIds = changes
		.filter((_) => _.intersectionRatio > 0)
		.map((_) => _.target.id);
};

// typescript complains about an async event handler, so wrap it in a non-async function
const onScroll = () => {
	if (!taskQueued) {
		taskQueued = true;

		void fastdom.measure(() => {
			taskQueued = false;

			visibleIframeIds.map(getDimensions).forEach((data) => {
				sendCoordinates(data[0], data[1]);
			});
		});
	}
};

const addScrollListener = (
	iframe: HTMLIFrameElement,
	respond: Respond,
): void => {
	if (iframeCounter === 0) {
		window.addEventListener('scroll', onScroll, {
			passive: true,
		});
		observer = new IntersectionObserver(onIntersect);
	}

	iframes[iframe.id] = {
		node: iframe,
		visible: false,
		respond,
	};
	iframeCounter += 1;

	if (observer) {
		observer.observe(iframe);
	}

	void fastdom
		.measure(() => iframe.getBoundingClientRect())
		.then((domRect) => {
			sendCoordinates(iframe.id, domRect);
		});
};

const removeScrollListener = (iframe: HTMLIFrameElement): void => {
	if (iframe.id in iframes) {
		if (observer) {
			observer.unobserve(iframe);
		}
		delete iframes[iframe.id];
		iframeCounter -= 1;
	}

	if (iframeCounter === 0) {
		window.removeEventListener('scroll', onScroll);
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	}
};

const isCallable = (x: unknown): x is Respond => typeof x === 'function';

const init = (register: RegisterListener): void => {
	register('scroll', (respond, start, iframe) => {
		if (!iframe) return;
		if (start && isCallable(respond)) {
			addScrollListener(iframe, respond);
		} else {
			removeScrollListener(iframe);
		}
	});
};

export const _ = { addScrollListener, removeScrollListener, reset };

export { init };

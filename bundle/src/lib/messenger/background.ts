import { isObject } from '@guardian/libs';
import {
	renderAdvertLabel,
	renderStickyScrollForMoreLabel,
} from '../../events/render-advert-label';
import { getAdvertById } from '../dfp/get-advert-by-id';
import fastdom from '../fastdom-promise';
import type { RegisterListener } from '../messenger';
import {
	sendProgressOnUnloadOnce,
	updateVideoProgress,
} from '../video-progress-reporting';

const isGallery = window.guardian.config.page.contentType === 'Gallery';

const INTERSCROLLER_TEMPLATE_ID = 11885667;

interface BackgroundSpecs {
	backgroundImage: string;
	backgroundRepeat?: string;
	backgroundPosition?: string;
	// native templates are sometimes using the british spelling of background-color for some reason, removed in getStylesFromSpec above
	backgroundColour?: string;
	backgroundColor?: string;
	backgroundSize?: string;
	transform?: string;
	scrollType?: 'interscroller' | 'fixed' | 'parallax';
	ctaUrl?: string;
	videoSource?: string;
}

const getStylesFromSpec = (
	specs: BackgroundSpecs,
): Omit<
	BackgroundSpecs,
	'scrollType' | 'backgroundColour' | 'ctaUrl' | 'videoSource'
> => {
	const styles = { ...specs };
	delete styles.scrollType;
	delete styles.ctaUrl;
	delete styles.videoSource;

	// native templates are sometimes using the british spelling of background-color for some reason
	if (styles.backgroundColour) {
		styles.backgroundColor = styles.backgroundColour;
		delete styles.backgroundColour;
	}
	return styles;
};

const isBackgroundSpecs = (specs: unknown): specs is BackgroundSpecs =>
	isObject(specs) && 'backgroundImage' in specs;

const createParent = (
	adSlot: HTMLElement,
	scrollType: BackgroundSpecs['scrollType'],
) => {
	let backgroundParent = adSlot.querySelector<HTMLDivElement>(
		'.creative__background-parent',
	);
	let background = adSlot.querySelector<HTMLDivElement>(
		'.creative__background',
	);

	if (!backgroundParent || !background) {
		backgroundParent = document.createElement('div');
		background = document.createElement('div');

		backgroundParent.classList.add('creative__background-parent');
		background.classList.add('creative__background');

		if (scrollType) {
			backgroundParent.classList.add(
				`creative__background-parent--${scrollType}`,
			);
			background.classList.add(`creative__background--${scrollType}`);
		}

		backgroundParent.appendChild(background);

		backgroundParent.style.zIndex = '-1';
		backgroundParent.style.position = 'absolute';
		backgroundParent.style.inset = '0';
		backgroundParent.style.clipPath =
			'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
		backgroundParent.style.overflow = 'hidden';

		background.style.inset = '0';
		background.style.transition = 'background 100ms ease';

		if (scrollType === 'interscroller') {
			background.style.height = '100vh';
		}
	}

	return { backgroundParent, background };
};

const setBackgroundStyles = (
	specs: BackgroundSpecs,
	background: HTMLElement,
): void => {
	const specStyles = getStylesFromSpec(specs);
	Object.assign(background.style, specStyles);
};

const setCtaURL = (
	ctaURL: string,
	backgroundParent: HTMLElement,
): HTMLElement => {
	const ctaURLAnchor = document.createElement('a');
	ctaURLAnchor.href = ctaURL;
	ctaURLAnchor.target = '_new';
	ctaURLAnchor.appendChild(backgroundParent);
	ctaURLAnchor.style.width = '100%';
	ctaURLAnchor.style.height = '100%';
	ctaURLAnchor.style.display = 'inline-block';
	return ctaURLAnchor;
};

const renderBottomLine = (
	background: HTMLElement,
	backgroundParent: HTMLElement,
	isGallery: boolean,
): void => {
	background.style.position = 'fixed';
	const bottomLine = document.createElement('div');
	bottomLine.classList.add('ad-slot__line');
	bottomLine.style.position = 'absolute';
	bottomLine.style.width = '100%';
	bottomLine.style.bottom = '0';
	if (isGallery) {
		bottomLine.style.borderBottom = '1px solid #333333';
	} else {
		bottomLine.style.borderBottom = '1px solid #dcdcdc';
	}

	backgroundParent.appendChild(bottomLine);
};

const setupParallax = (
	adSlot: HTMLElement,
	background: HTMLElement,
	backgroundParent: HTMLElement,
) => {
	background.style.position = 'absolute';
	adSlot.style.position = 'relative';

	const onScroll = (background: HTMLElement) =>
		fastdom
			.measure(() => background.getBoundingClientRect())
			.then((rect) =>
				fastdom.mutate(() => {
					const backgroundHeight = rect.height;
					const windowHeight = window.innerHeight;

					// we should scroll at a rate such that we don't run out of background (when non-repeating)
					const parallaxBackgroundMovement = Math.floor(
						(rect.bottom / (windowHeight + backgroundHeight)) * 130,
					);

					background.style.backgroundPositionY = `${parallaxBackgroundMovement}%`;
				}),
			);

	const onIntersect: IntersectionObserverCallback = (entries) =>
		entries
			.filter((entry) => entry.isIntersecting)
			.forEach(() => {
				window.addEventListener(
					'scroll',
					() => void onScroll(background),
					{
						passive: true,
					},
				);
				void onScroll(background);
			});

	const observer = new IntersectionObserver(onIntersect, {
		rootMargin: '10px',
	});

	observer.observe(backgroundParent);
};

const setupBackground = async (
	specs: BackgroundSpecs,
	adSlot: HTMLElement,
): Promise<void> => {
	const { backgroundParent, background } = createParent(
		adSlot,
		specs.scrollType,
	);

	const interscrollerTemplateId = 11885667;

	return fastdom.mutate(() => {
		setBackgroundStyles(specs, background);

		if (specs.scrollType === 'parallax') {
			setupParallax(adSlot, background, backgroundParent);
		}

		// fixed background is very similar to interscroller, generally with a smaller height
		if (specs.scrollType === 'fixed') {
			adSlot.style.position = 'relative';
			background.style.position = 'fixed';

			if (specs.backgroundColor) {
				backgroundParent.style.backgroundColor = specs.backgroundColor;
			}
		}

		if (specs.scrollType === 'interscroller') {
			adSlot.style.height = '85vh';
			adSlot.style.marginBottom = '12px';
			adSlot.style.position = 'relative';
			adSlot.style.width = '100%';

			void renderAdvertLabel(adSlot, interscrollerTemplateId);
			void renderStickyScrollForMoreLabel(backgroundParent, isGallery);
			void renderBottomLine(background, backgroundParent, isGallery);

			if (specs.ctaUrl) {
				const anchor = setCtaURL(specs.ctaUrl, backgroundParent);
				adSlot.insertBefore(anchor, adSlot.firstChild);
			}

			if (specs.videoSource) {
				const video = document.createElement('video');
				video.autoplay = true;
				video.muted = true;
				video.playsInline = true;
				video.src = specs.videoSource;
				video.style.inset = '50% 0 0 50%';
				video.style.position = 'fixed';
				video.style.height = '100%';
				video.style.transform = 'translate(-50%, -50%)';
				background.appendChild(video);

				let played = false;
				video.onended = () => (played = true);

				const observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (
								entry.isIntersecting &&
								!played &&
								video.paused
							) {
								void video.play();
							} else {
								video.pause();
							}
						});
					},
					{ root: null, rootMargin: '0px', threshold: 0.2 },
				);

				observer.observe(backgroundParent);

				const advert = getAdvertById(adSlot.id);

				const shouldReportVideoProgress =
					advert?.creativeTemplateId === INTERSCROLLER_TEMPLATE_ID;

				if (shouldReportVideoProgress) {
					void sendProgressOnUnloadOnce();

					video.ontimeupdate = function () {
						const percent = Math.round(
							100 * (video.currentTime / video.duration),
						);
						updateVideoProgress(adSlot.id, percent);
					};
				}
			}
		} else {
			adSlot.insertBefore(backgroundParent, adSlot.firstChild);
		}
	});
};

const init = (register: RegisterListener): void => {
	register('background', async (specs, ret, iframe): Promise<void> => {
		if (!isBackgroundSpecs(specs)) {
			return Promise.resolve();
		}
		const adSlot = iframe?.closest<HTMLElement>('.js-ad-slot');
		if (adSlot) {
			return setupBackground(specs, adSlot);
		}
	});
};

export const _ = {
	setupBackground,
	getStylesFromSpec,
};

export { init };

export type { BackgroundSpecs };

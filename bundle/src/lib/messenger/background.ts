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
	hasAudio?: 'true' | 'false';
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

		if (scrollType === 'interscroller' || scrollType === 'fixed') {
			background.style.height = '100vh';
		}
	}

	return { backgroundParent, background };
};

const
	setBackgroundStyles = (
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

// from https://github.com/guardian/csnx/blob/main/libs/%40guardian/source/src/react-components/__generated__/icons/SvgAudio.tsx
const unmutedIcon = `
<svg
		width="30"
		height="30"
		viewBox="-3 -3 30 30"
		xmlns="http://www.w3.org/2000/svg"
		focusable={false}
		aria-hidden={true}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 15.75h3.75L11 21h1V3h-1L5.75 8.25H2l-1 1v5.5zM21.3 12c0 2.7-.925 5.175-2.5 7.175l.55.525A9.9 9.9 0 0 0 23 12c0-3.125-1.425-5.9-3.65-7.725l-.55.525c1.575 2 2.5 4.475 2.5 7.2m-5.2 0q0 2.362-1.275 4.2l.65.65C16.75 15.575 17.5 13.9 17.5 12c0-1.925-.75-3.6-2.025-4.875l-.65.65C15.675 9 16.1 10.425 16.1 12"
			fill="#fff"
		/>
	</svg>
`;

// from https://github.com/guardian/csnx/blob/main/libs/%40guardian/source/src/react-components/__generated__/icons/SvgAudioMute.tsx
const mutedIcon = `
<svg
		width="30"
		height="30"
		viewBox="-3 -3 30 30"
		xmlns="http://www.w3.org/2000/svg"
		focusable={false}
		aria-hidden={true}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M2 15.75h3.75L11 21h1V3h-1L5.75 8.25H2l-1 1v5.5zM17.28 12l-3.4 3.85.725.725 3.825-3.425 3.85 3.425.725-.725L19.58 12l3.425-3.85-.725-.725-3.85 3.425-3.825-3.425-.725.725z"
			fill="#fff"
		/>
	</svg>
`;

/**
 * Create a mute/unmute toggle button for an interscroller video.
 * The button is appended to adSlot (rather than backgroundParent)
 * so it sits outside the CTA anchor link.
 */
const createMuteButton = (
	video: HTMLVideoElement,
	adSlot: HTMLElement,
): void => {
	const muteButton = document.createElement('button');
	muteButton.setAttribute('aria-label', 'Unmute video');
	muteButton.style.position = 'absolute';
	muteButton.style.top = '48px'; // space[12]
	muteButton.style.right = '16px'; //space[4]
	muteButton.style.borderRadius = '50%';
	muteButton.style.border = 'none';
	muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
	muteButton.style.padding = '0';
	muteButton.style.display = 'flex';
	muteButton.style.cursor = 'pointer';
	muteButton.innerHTML = mutedIcon;

	muteButton.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		video.muted = !video.muted;
		if (video.muted) {
			muteButton.setAttribute('aria-label', 'Unmute video');
			muteButton.innerHTML = mutedIcon;
		} else {
			muteButton.setAttribute('aria-label', 'Mute video');
			muteButton.innerHTML = unmutedIcon;
		}
	});

	adSlot.appendChild(muteButton);
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

				if (specs.hasAudio === 'true') {
					createMuteButton(video, adSlot);
				}

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

const initBackgroundMessage = (register: RegisterListener): void => {
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

export { initBackgroundMessage };

export type { BackgroundSpecs };

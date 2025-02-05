import { getCookie } from '@guardian/libs';
import crossIcon from '../../static/svg/icon/cross.svg';
import fastdom from '../lib/fastdom-promise';

const templatesWithoutLabels = [
	10077207, // CAPI_MULTIPLE_HOSTED
	10069167, // CAPI_MULTIPLE_PAIDFOR
	12317037, // EVENTS_MULTIPLE
	10070487, // CAPI_SINGLE_PAIDFOR
	10063287, // MANUAL_MULTIPLE
];

const shouldRenderLabel = (
	adSlotNode: HTMLElement,
	creativeTemplateId?: number,
): boolean => {
	if (
		creativeTemplateId &&
		templatesWithoutLabels.includes(creativeTemplateId)
	) {
		return false;
	}
	if (
		adSlotNode.classList.contains('ad-slot--frame') ||
		adSlotNode.classList.contains('ad-slot--gc') ||
		adSlotNode.classList.contains('u-h') ||
		// set for out-of-page (1x1) and empty (2x2) ads
		adSlotNode.classList.contains('ad-slot--collapse') ||
		adSlotNode.getAttribute('data-label') === 'false'
	) {
		return false;
	}

	return true;
};

const shouldRenderCloseButton = (adSlotNode: HTMLElement): boolean =>
	adSlotNode.classList.contains('ad-slot--mobile-sticky');

const createAdCloseDiv = (): HTMLElement => {
	const buttonEl: HTMLElement = document.createElement('button');
	buttonEl.className = 'ad-slot__close-button';
	buttonEl.innerHTML = crossIcon;
	buttonEl.onclick = () => {
		const container: HTMLElement | null = buttonEl.closest(
			'.mobilesticky-container',
		);
		if (container) container.remove();
	};

	const closeDiv: HTMLElement = document.createElement('div');
	closeDiv.style.cssText = 'position: relative;padding: 0;height: 0';
	closeDiv.appendChild(buttonEl);

	return closeDiv;
};

const shouldRenderAdTestLabel = (adSlotNode: HTMLElement): boolean =>
	!!getCookie({
		name: 'adtestInLabels',
		shouldMemoize: true,
	}) && !adSlotNode.classList.contains('ad-slot--sky');

// If `adtest` cookie is set, display its value in the ad label
const createAdTestLabel = (
	shouldRender: boolean,
	adTestName: string | null,
): string => {
	let adTestLabel = '';

	if (shouldRender && adTestName) {
		adTestLabel += ` [?adtest=${adTestName}] `;
	}

	return adTestLabel;
};

const createAdTestCookieRemovalLink = (): HTMLElement => {
	const adTestCookieRemovalLink = document.createElement('div');
	adTestCookieRemovalLink.style.cssText =
		'position: relative;padding: 0;text-align: left;box-sizing: border-box;display: block;width: 0;height: 0';

	const url = new URL(window.location.href);
	url.searchParams.set('adtest', 'clear');

	const clearLink = document.createElement('a');
	clearLink.className = 'ad-slot__adtest-cookie-clear-link';
	clearLink.href = url.href;
	clearLink.innerHTML = 'clear';

	adTestCookieRemovalLink.appendChild(clearLink);

	return adTestCookieRemovalLink;
};

const renderAdvertLabel = (
	adSlotNode: HTMLElement,
	creativeTemplateId?: number,
): Promise<Promise<void>> => {
	return fastdom.measure(() => {
		if (shouldRenderLabel(adSlotNode, creativeTemplateId)) {
			const renderAdTestLabel = shouldRenderAdTestLabel(adSlotNode);
			const adTestClearExists =
				adSlotNode.parentNode?.firstElementChild
					?.firstElementChild instanceof HTMLAnchorElement;
			const adTestCookieName = getCookie({
				name: 'adtest',
				shouldMemoize: true,
			});

			const adLabelContent = `Advertisement${createAdTestLabel(
				renderAdTestLabel,
				adTestCookieName,
			)}`;

			return fastdom.mutate(() => {
				adSlotNode.setAttribute('data-label-show', 'true');
				adSlotNode.setAttribute('ad-label-text', adLabelContent);
				// Remove this once new `ad-slot-container--centre-slot` class is in place
				if (
					adSlotNode.parentElement?.classList.contains(
						'ad-slot-container',
					) &&
					adSlotNode.id === 'dfp-ad--top-above-nav'
				) {
					adSlotNode.parentElement.setAttribute(
						'top-above-nav-ad-rendered',
						'true',
					);
				}
				// \Remove this

				if (shouldRenderCloseButton(adSlotNode)) {
					adSlotNode.insertBefore(
						createAdCloseDiv(),
						adSlotNode.firstChild,
					);
				}
				if (
					renderAdTestLabel &&
					adTestCookieName &&
					!adTestClearExists
				) {
					adSlotNode.parentNode?.insertBefore(
						createAdTestCookieRemovalLink(),
						adSlotNode,
					);
				}
			});
		}

		return Promise.resolve();
	});
};

const renderStickyScrollForMoreLabel = (
	adSlotNode: HTMLElement,
	isGallery: boolean,
): Promise<void> =>
	fastdom.mutate(() => {
		const scrollForMoreLabel = document.createElement('div');
		scrollForMoreLabel.classList.add('ad-slot__scroll');
		scrollForMoreLabel.innerHTML = 'Scroll for More';
		scrollForMoreLabel.setAttribute('role', 'button');
		scrollForMoreLabel.onclick = (event) => {
			adSlotNode.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
			event.preventDefault();
		};

		if (isGallery) {
			scrollForMoreLabel.classList.add('ad-slot--dark');
		}

		adSlotNode.appendChild(scrollForMoreLabel);
	});

export {
	renderAdvertLabel,
	renderStickyScrollForMoreLabel,
	shouldRenderLabel,
	templatesWithoutLabels,
};

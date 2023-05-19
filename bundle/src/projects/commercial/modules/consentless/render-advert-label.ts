/* eslint-disable @typescript-eslint/no-misused-promises
-- Fastdom measure and mutate signatures are Promise<void>
-- Nested fastdom measure-mutate promises throw the error:
-- "Promise returned in function argument where a void return was expected"
*/
import crossIcon from '../../../../../static/svg/icon/cross.svg';
import fastdom from '../../../../lib/fastdom-promise';

const shouldRenderConsentlessLabel = (adSlotNode: HTMLElement): boolean => {
	if (
		adSlotNode.classList.contains('ad-slot--merchandising') ||
		adSlotNode.classList.contains('ad-slot--merchandising-high')
	) {
		return true;
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

export const createAdCloseDiv = (): HTMLElement => {
	const closeDiv: HTMLElement = document.createElement('button');
	closeDiv.className = 'ad-slot__close-button';
	closeDiv.innerHTML = crossIcon;
	closeDiv.onclick = () => {
		const container: HTMLElement | null = closeDiv.closest(
			'.mobilesticky-container',
		);
		if (container) container.remove();
	};
	return closeDiv;
};

export const renderConsentlessAdvertLabel = (
	adSlotNode: HTMLElement,
): Promise<Promise<void>> => {
	return fastdom.measure(() => {
		if (shouldRenderConsentlessLabel(adSlotNode)) {
			//Assigning the ad label text like this allows us to conditionally add extra text to it
			//eg. for the ad test labelling for google ads
			const adLabelContent = `Advertisement`;
			return fastdom.mutate(() => {
				//when the time comes to use a different ad label for consentless, we can update
				//the attribute name that we set below and add a css selector accordingly
				adSlotNode.setAttribute('data-label-show', 'true');
				adSlotNode.setAttribute('ad-label-text', adLabelContent);
			});
		}
		return Promise.resolve();
	});
};

// TODO: flesh out this function once we have a better idea of what we want it to look like
// const insertConsentlessLabelInfo = (adLabelNode: HTMLElement): void => {
// 	const consentlessLabelInfo = document.createElement('button');
// 	consentlessLabelInfo.className = 'ad-slot__consentless-info u-button-reset';
// 	consentlessLabelInfo.setAttribute(
// 		'title',
// 		`Because of your choice this advertising sets no cookies and doesn't track you.`,
// 	);
// 	consentlessLabelInfo.innerHTML = `Opt Out: Why am I seeing this?`;
// 	adLabelNode.appendChild(consentlessLabelInfo);
// };

import { createAdSlot, wrapSlotInContainer } from 'core/create-ad-slot';
import { commercialFeatures } from 'lib/commercial-features';
import fastdom from './fastdom-promise';

/**
 * Initialise high merch ad slot
 * @returns Promise
 */
export const init = (): Promise<void> => {
	if (commercialFeatures.highMerch) {
		const anchorSelector = window.guardian.config.page.commentable
			? '#comments + *'
			: '.content-footer > :first-child';
		const anchor = document.querySelector(anchorSelector);
		const slot = createAdSlot('merchandising-high');
		const container = wrapSlotInContainer(slot, {
			className: 'fc-container fc-container--commercial',
		});
		container.style.display = 'flex';
		container.style.justifyContent = 'center';
		return fastdom.mutate(() => {
			if (anchor?.parentNode) {
				anchor.parentNode.insertBefore(container, anchor);
			}
		});
	}

	return Promise.resolve();
};

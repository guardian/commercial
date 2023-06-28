import { createAdSlot } from 'core/create-ad-slot';
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
		const container = document.createElement('div');

		container.className = 'fc-container fc-container--commercial';
		const slot = createAdSlot(
			window.guardian.config.page.isPaidContent
				? 'high-merch-paid'
				: 'high-merch',
		);

		container.appendChild(slot);

		return fastdom.mutate(() => {
			if (anchor?.parentNode) {
				anchor.parentNode.insertBefore(container, anchor);
			}
		});
	}

	return Promise.resolve();
};
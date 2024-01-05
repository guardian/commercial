import { createAdSlot, wrapSlotInContainer } from 'core/create-ad-slot';
import { commercialFeatures } from 'lib/commercial-features';
import fastdom from '../../lib/fastdom-promise';

/**
 * Initialise merchandising-high ad slot on Frontend rendered content
 *
 * On DCR, these ad slots are server side rendered
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
		// Remove this once new `ad-slot-container--centre-slot` class is in place
		container.style.display = 'flex';
		container.style.justifyContent = 'center';
		// \Remove this
		return fastdom.mutate(() => {
			if (anchor?.parentNode) {
				anchor.parentNode.insertBefore(container, anchor);
			}
		});
	}

	return Promise.resolve();
};

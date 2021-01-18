import config from '@guardian/frontend/static/src/javascripts/lib/config';
import fastdom from '@guardian/frontend/static/src/javascripts/lib/fastdom-promise';
import { commercialFeatures } from '@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/commercial-features';
import { createSlots } from './dfp/create-slots';

export const init = () => {
	if (commercialFeatures.highMerch) {
		const anchorSelector = config.get('page.commentable')
			? '#comments + *'
			: '.content-footer > :first-child';
		const anchor = document.querySelector(anchorSelector);
		const container = document.createElement('div');

		container.className = 'fc-container fc-container--commercial';
		const slots = createSlots(
			config.get('page.isPaidContent') ? 'high-merch-paid' : 'high-merch',
		);

		slots.forEach((slot) => {
			container.appendChild(slot);
		});

		return fastdom.mutate(() => {
			if (anchor && anchor.parentNode) {
				anchor.parentNode.insertBefore(container, anchor);
			}
		});
	}

	return Promise.resolve();
};

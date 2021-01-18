import { commercialFeatures } from '@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/commercial-features';
import { Sticky } from '@guardian/frontend/static/src/javascripts/projects/common/modules/ui/sticky';

export const init = () => {
	if (!commercialFeatures.paidforBand) {
		return Promise.resolve(false);
	}

	const elem = document.querySelector('.paidfor-band');
	if (elem) {
		new Sticky(elem).init();
	}

	return Promise.resolve(true);
};

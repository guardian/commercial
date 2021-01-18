import fastdom from '@guardian/frontend/static/src/javascripts/lib/fastdom-promise';

export const hideElement = (element) =>
	fastdom.mutate(() => element.classList.add('u-h'));

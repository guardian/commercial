import config from '@guardian/frontend/static/src/javascripts/lib/config';

const init = (register) => {
	register('get-page-targeting', () => config.get('page.sharedAdTargeting'));
};

export { init };

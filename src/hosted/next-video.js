import config from '@guardian/frontend/static/src/javascripts/lib/config';
import fastdom from '@guardian/frontend/static/src/javascripts/lib/fastdom-promise';
import fetchJson from '@guardian/frontend/static/src/javascripts/lib/fetch-json';

const loadNextVideo = () => {
	const placeholders = document.querySelectorAll('.js-autoplay-placeholder');

	if (placeholders.length) {
		return fetchJson(
			`${config.get('page.ajaxUrl')}/${config.get(
				'page.pageId',
			)}/autoplay.json`,
			{
				mode: 'cors',
			},
		).then((json) =>
			fastdom.mutate(() => {
				let i;
				for (i = 0; i < placeholders.length; i += 1) {
					placeholders[i].innerHTML = json.html;
				}
			}),
		);
	}

	return Promise.resolve();
};

export { loadNextVideo as init, loadNextVideo as load };

import config from '@guardian/frontend/static/src/javascripts/lib/config';
import fetchJson from '@guardian/frontend/static/src/javascripts/lib/fetch-json';
import { load } from '../hosted/next-video';

jest.mock('lib/fetch-json', () =>
	jest.fn(() => Promise.resolve({ html: '<div class="video"></div>' })),
);

describe('Hosted Next Video', () => {
	beforeAll(() => {
		config.set('page', {
			ajaxUrl: 'some.url',
			pageId: 'pageId',
		});
	});
	beforeEach(() => {
		if (document.body) {
			document.body.innerHTML =
				'<div class="js-autoplay-placeholder"></div>';
		}
	});

	afterEach(() => {
		if (document.body) {
			document.body.innerHTML = '';
		}
	});

	it('should exist', () => {
		expect(load).toBeDefined();
	});

	it('should make an ajax call and insert html', (done) => {
		load()
			.then(() => {
				expect(fetchJson).toHaveBeenCalledWith(
					'some.url/pageId/autoplay.json',
					{
						mode: 'cors',
					},
				);
				expect(
					document.querySelector('.js-autoplay-placeholder .video'),
				).not.toBeNull();
			})
			.then(done)
			.catch(done.fail);
	});
});

import { inline1Response } from '../lib/header-bidding/sdc/fixtures';
import { sdc } from '../lib/header-bidding/sdc/sdc';
import { Advert } from './Advert';
import { createAdvert } from './create-advert';

jest.mock('./Advert', () => ({
	Advert: jest.fn(),
}));
jest.mock('../lib/header-bidding/sdc/sdc', () => ({
	sdc: { getInline1Data: jest.fn() },
}));

describe('createAdvert inline1 preview', () => {
	const originalUrl = window.location.href;

	beforeEach(() => {
		jest.mocked(sdc.getInline1Data).mockResolvedValue(inline1Response);
	});

	afterEach(() => {
		window.history.replaceState(null, '', originalUrl);
		document.body.innerHTML = '';
	});

	it('renders preview content without constructing a GPT-backed advert', async () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline1';
		document.body.appendChild(element);
		const render = jest.fn(() => {
			element.textContent = 'DCR-rendered support message';
		});
		element.addEventListener('commercial.sdc-render', render);

		expect(createAdvert(element)).toBeNull();
		await Promise.resolve();

		expect(Advert).not.toHaveBeenCalled();
		expect(render).toHaveBeenCalledTimes(1);
		expect(element.textContent).toBe('DCR-rendered support message');
		expect(element.classList.contains('ad-slot--rendered')).toBe(true);

		// Static slot discovery can revisit an element that is not in dfpEnv.
		expect(createAdvert(element)).toBeNull();
		expect(Advert).not.toHaveBeenCalled();
		expect(render).toHaveBeenCalledTimes(1);
	});

	it.each(['', '?simulate-inline1=false'])(
		'creates a normal Inline1 advert with query %s',
		(query) => {
			window.history.replaceState(null, '', `/${query}`);
			const element = document.createElement('div');
			element.id = 'dfp-ad--inline1';

			expect(createAdvert(element)).toBeInstanceOf(Advert);
			expect(Advert).toHaveBeenCalledWith(element, undefined, undefined);
		},
	);

	it('continues creating other adverts when the preview is enabled', () => {
		window.history.replaceState(null, '', '/?simulate-inline1=true');
		const element = document.createElement('div');
		element.id = 'dfp-ad--inline2';

		expect(createAdvert(element)).toBeInstanceOf(Advert);
		expect(Advert).toHaveBeenCalledWith(element, undefined, undefined);
	});
});

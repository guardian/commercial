import { refreshAdvert } from 'display/load-advert';
import { getAdvertById } from 'lib/dfp/get-advert-by-id';
import { _ } from './passback-refresh';

const { passbackRefresh } = _;

jest.mock('lib/dfp/get-advert-by-id', () => ({
	getAdvertById: jest.fn().mockReturnValue({
		slot: {
			setTargeting: jest.fn(),
		},
	}),
}));

jest.mock('display/load-advert', () => ({
	refreshAdvert: jest.fn(),
}));

describe('Cross-frame messenger: refresh', () => {
	beforeEach(() => {
		document.body.innerHTML = `
              <div id="slot01" class="js-ad-slot">
                <div id="container01">
                    <iframe id="iframe01" class="iframe"></iframe>
                </div>
              </div>`;

		expect.hasAssertions();
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});
	describe('passbackRefresh', () => {
		it('should successfully define an advert, call refreshAdvert and sets targeting', () => {
			const fallback = document.createElement('div');
			const advert = getAdvertById('');
			passbackRefresh(
				'mockString',
				document.getElementById('slot01') ?? fallback,
			);
			expect(getAdvertById).toHaveBeenCalledWith('slot01');
			expect(refreshAdvert).toHaveBeenCalled();
			expect(advert?.slot.setTargeting).toHaveBeenCalledWith(
				'passback',
				'mockString',
			);
		});
	});
});

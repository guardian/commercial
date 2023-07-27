import { getAdvertById } from 'lib/dfp/get-advert-by-id';
import { refreshAdvert } from 'lib/dfp/load-advert';
import { _ } from './refresh';

jest.mock('../dfp/get-advert-by-id', () => ({
	getAdvertById: jest.fn().mockReturnValue({
		slot: {
			setTargeting: jest.fn(),
		},
	}),
}));

jest.mock('../dfp/load-advert', () => ({
	refreshAdvert: jest.fn(),
}));

describe('Cross-frame messenger: refresh', () => {
	beforeEach(() => {
		document.body.innerHTML = `
              <div id="slot01" class="js-ad-slot" style="width: 7px; height: 14px;" >
                <div id="container01">
                    <iframe id="iframe01" class="iframe" data-unit="ch"></iframe>
                </div>
              </div>`;

		expect.hasAssertions();
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});
	describe('passbackRefresh', () => {
		it('should successfuly define an advert and call refreshAdvert and set targetting', () => {
			const fallback = document.createElement('div');
			const advert = getAdvertById('');
			_.passbackRefresh(
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
		it('if specs is not of type string refresh doesnt execute', () => {
			const fallback = document.createElement('div');
			const advert = getAdvertById('');
			_.passbackRefresh(
				{ messageSpecs: 'mockString' },
				document.getElementById('slot01') ?? fallback,
			);
			expect(getAdvertById).toHaveBeenCalledWith('slot01');
			expect(refreshAdvert).not.toHaveBeenCalled();
			expect(advert?.slot.setTargeting).not.toHaveBeenCalled();
		});
	});
});

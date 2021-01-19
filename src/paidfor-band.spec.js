import { Sticky } from '@guardian/frontend/static/src/javascripts/projects/common/modules/ui/sticky';
import { init } from './paidfor-band';

jest.mock(
	'@guardian/frontend/static/src/javascripts/projects/common/modules/commercial/commercial-features',
	() => ({
		commercialFeatures: {
			paidforBand: true,
		},
	}),
);

jest.mock(
	'@guardian/frontend/static/src/javascripts/projects/common/modules/ui/sticky',
	() => ({
		Sticky: class {},
	}),
);

describe('Paid for band', () => {
	it('should exist', () => {
		expect(init).toBeDefined();
	});

	it('should create a Sticky element', () => {
		if (document.body) {
			document.body.innerHTML = '<div class="paidfor-band"></div>';
		}
		Sticky.prototype.init = jest.fn();

		return init().then(() => {
			expect(Sticky.prototype.init).toHaveBeenCalled();
		});
	});
});

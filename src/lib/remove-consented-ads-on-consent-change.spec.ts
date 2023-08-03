import { onConsentChange } from '@guardian/consent-management-platform';
import type {
	Callback,
	ConsentState,
} from '@guardian/consent-management-platform/dist/types';
import { removeConsentedAdsOnConsentChange } from './remove-consented-ads-on-consent-change';
import { removeSlots } from './remove-slots';

jest.mock('./experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(() => false),
}));

jest.mock('@guardian/consent-management-platform', () => ({
	onConsentChange: jest.fn(),
}));

jest.mock('./remove-slots', () => ({
	removeSlots: jest.fn(() => Promise.resolve()),
}));

const mockOnConsentChange = (consentState: ConsentState) =>
	(onConsentChange as jest.Mock).mockImplementation((cb: Callback) =>
		cb(consentState),
	);

describe('removeConsetedAdsOnConsentChange()', () => {
	it('tcfv2 canTarget: false', () => {
		const consentState: ConsentState = {
			canTarget: false,
			framework: 'tcfv2',
		};

		mockOnConsentChange(consentState);

		void removeConsentedAdsOnConsentChange();

		expect(removeSlots).toBeCalled();
	});
});

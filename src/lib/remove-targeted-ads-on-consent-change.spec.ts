import { onConsentChange } from '@guardian/consent-management-platform';
import type {
	Callback,
	ConsentState,
} from '@guardian/consent-management-platform/dist/types';
import { removeSlots } from './remove-slots';
import { _ } from './remove-targeted-ads-on-consent-change';

// we need too bypass the `once()` wrapper for testing
const { _removeTargetedAdsOnConsentChange: removeTargetedAdsOnConsentChange } =
	_;

jest.mock('common/modules/experiments/ab', () => ({
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

describe('manageAdFreeCookieOnConsentChange()', () => {
	it('tcfv2 canTarget: false', () => {
		const consentState: ConsentState = {
			canTarget: false,
			framework: 'tcfv2',
		};

		mockOnConsentChange(consentState);

		removeTargetedAdsOnConsentChange();

		expect(removeSlots).toBeCalled();
	});
});

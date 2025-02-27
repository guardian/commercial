import { type ConsentState, getConsentFor } from '@guardian/libs';
import { hasConsentFor } from './consent';

jest.mock('@guardian/libs', () => ({
	...jest.requireActual('@guardian/libs'),
	getConsentFor: jest.fn().mockReturnValue(true),
}));

describe('consent', () => {
	describe('hasConsentFor', () => {
		it('returns true if in TCF region and consent granted for specific vendor', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'tcfv2',
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(true);
		});

		it('returns false if in TCF region and consent not granted for specific vendor', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'tcfv2',
			};
			(getConsentFor as jest.Mock).mockReturnValueOnce(false);
			expect(hasConsentFor('criteo', mockConsentState)).toBe(false);
		});

		it('returns true if in AUS region and personalisedAdvertising value is true', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'aus',
				aus: { personalisedAdvertising: true },
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(true);
		});

		it('returns false if in AUS region and personalisedAdvertising value is false', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'aus',
				aus: { personalisedAdvertising: false },
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(false);
		});

		it('returns true if in US region and doNotSell value is false', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'usnat',
				usnat: { doNotSell: false, signalStatus: 'ready' },
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(true);
		});

		it('returns false if in US region and doNotSell value is true', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: 'usnat',
				usnat: { doNotSell: true, signalStatus: 'ready' },
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(false);
		});

		it('returns false if in unknown consent framework', () => {
			const mockConsentState: ConsentState = {
				canTarget: true,
				framework: null,
			};
			expect(hasConsentFor('criteo', mockConsentState)).toBe(false);
		});
	});
});

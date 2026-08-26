import {
	AD_LABEL_HEIGHT,
	PREBID_AUCTION_TIMEOUT,
	PREBID_FAILSAFE_TIMEOUT,
	TOP_ABOVE_NAV_HEIGHT,
} from '.';

// These tests ensure that we look twice when changing a constant
describe('Constant values are constant', () => {
	test('TOP_ABOVE_NAV_HEIGHT', () => {
		expect(TOP_ABOVE_NAV_HEIGHT).toBe(250);
	});

	test('PREBID_AUCTION_TIMEOUT', () => {
		expect(PREBID_AUCTION_TIMEOUT).toBe(1500);
	});

	test('PREBID_FAILSAFE_TIMEOUT', () => {
		expect(PREBID_FAILSAFE_TIMEOUT).toBe(3000);
	});

	test('AD_LABEL_HEIGHT', () => {
		expect(AD_LABEL_HEIGHT).toBe(24);
	});
});

describe('Prebid timeout combination', () => {
	/**
	 * The failsafe timeout should always be much larger than the auction timeout. The failsafe timeout is a safety
	 * net that invokes the callback in case something goes wrong with Prebid. If these two timeouts are too close
	 * together, the failsafe timeout might often be invoked before the auction timeout has a chance to complete.
	 */
	test('Ensure there is enough buffer between the auction and failsafe timeout', () => {
		expect(PREBID_AUCTION_TIMEOUT + 1000 <= PREBID_FAILSAFE_TIMEOUT).toBe(
			true,
		);
	});
});

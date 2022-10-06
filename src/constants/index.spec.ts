import { AD_LABEL_HEIGHT, PREBID_TIMEOUT, TOP_ABOVE_NAV_HEIGHT } from '.';

// These tests ensure that we look twice when changing a constant

describe('Constant values are constant', () => {
	test('TOP_ABOVE_NAV_HEIGHT', () => {
		expect(TOP_ABOVE_NAV_HEIGHT).toBe(90);
	});

	test('PREBID_TIMEOUT', () => {
		expect(PREBID_TIMEOUT).toBe(1500);
	});

	test('PREBID_TIMEOUT', () => {
		expect(AD_LABEL_HEIGHT).toBe(24);
	});
});

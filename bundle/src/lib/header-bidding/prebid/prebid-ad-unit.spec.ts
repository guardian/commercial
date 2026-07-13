import type { PageTargeting } from '@guardian/commercial-core/targeting/build-page-targeting';
import type { ConsentState } from '@guardian/consent-manager';
import { isUserInTestGroup } from '../../../ab-testing';
import type { Advert } from '../../../define/Advert';
import type { HeaderBiddingSlot } from '../prebid-types';
import { bids } from './bidders/config';
import { PrebidAdUnit } from './prebid-ad-unit';

function buildDummyBid() {
	return {
		bidder: 'dummy-bidder',
		params: { placementId: 'dummy-placement-id' },
	};
}

jest.mock('./bidders/config', () => ({
	bids: jest.fn().mockReturnValue([buildDummyBid()]),
}));

jest.mock('../../../ab-testing', () => ({
	isUserInTestGroup: jest.fn(),
}));

const mockedBids = bids as jest.MockedFunction<typeof bids>;

const mockPageTargeting = {} as PageTargeting;

const mockConsentState = {
	tcfv2: {
		consents: { 1: false },
		eventStatus: 'tcloaded',
		vendorConsents: { abc: false },
		addtlConsent: 'xyz',
		gdprApplies: true,
		tcString: 'YAAA',
	},
	gpcSignal: true,
	canTarget: true,
	framework: 'tcfv2',
} satisfies ConsentState;

const buildAdvert = (id: string) =>
	({
		id,
		gpid: 'test-gpid',
		headerBiddingSizes: null,
	}) as unknown as Advert;

describe('PrebidAdUnit', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedBids.mockReturnValue([buildDummyBid()]);
	});

	test('returns the correct bids and sizes for slot', () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false);
		const advert = buildAdvert('dfp-ad--top-above-nav');
		const slot: HeaderBiddingSlot = {
			key: 'top-above-nav',
			sizes: [[728, 90]],
		};

		const adUnit = new PrebidAdUnit(
			advert,
			slot,
			mockPageTargeting,
			mockConsentState,
		);

		expect(adUnit.mediaTypes).toEqual({
			banner: {
				sizes: slot.sizes,
			},
		});
		expect(adUnit.bids).toEqual([buildDummyBid()]);
		expect(mockedBids).toHaveBeenCalledWith(
			advert.id,
			slot.sizes,
			mockPageTargeting,
			advert.gpid,
			mockConsentState,
		);
		expect(advert.headerBiddingSizes).toEqual(slot.sizes);
	});

	test('adds the video media type for non-inline1 slots', () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		const advert = buildAdvert('dfp-ad--inline1');
		const slot: HeaderBiddingSlot = {
			key: 'inline1',
			sizes: [
				[300, 250],
				[620, 350],
				[300, 197],
				[640, 360],
			],
		};

		const adUnit = new PrebidAdUnit(
			advert,
			slot,
			mockPageTargeting,
			mockConsentState,
		);

		expect(adUnit.mediaTypes).toEqual({
			banner: {
				sizes: [[300, 250]],
			},
			video: {
				playerSize: [
					[620, 350],
					[300, 197],
					[640, 360],
				],
				context: 'outstream',
				placement: 3,
				plcmt: 4,
			},
		});
	});

	test('does not add the video media type for non-inline1 slots', () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		const advert = buildAdvert('dfp-ad--top-above-nav');
		const slot: HeaderBiddingSlot = {
			key: 'top-above-nav',
			sizes: [[728, 90]],
		};

		const adUnit = new PrebidAdUnit(
			advert,
			slot,
			mockPageTargeting,
			mockConsentState,
		);

		expect(adUnit.mediaTypes).toEqual({
			banner: {
				sizes: slot.sizes,
			},
		});
	});

	test('does not add the video media type when NOT in AB test', () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(false);
		const advert = buildAdvert('dfp-ad--inline1');
		const slot: HeaderBiddingSlot = {
			key: 'inline1',
			sizes: [[728, 90]],
		};

		const adUnit = new PrebidAdUnit(
			advert,
			slot,
			mockPageTargeting,
			mockConsentState,
		);

		expect(adUnit.mediaTypes).toEqual({
			banner: {
				sizes: slot.sizes,
			},
		});
	});

	test('uses outstream video sizes only in video media type when in AB test', () => {
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		const advert = buildAdvert('dfp-ad--inline1');
		const slot: HeaderBiddingSlot = {
			key: 'inline1',
			sizes: [
				[300, 250],
				[620, 350],
				[300, 197],
				[640, 360],
			],
		};

		const adUnit = new PrebidAdUnit(
			advert,
			slot,
			mockPageTargeting,
			mockConsentState,
		);

		expect(adUnit.mediaTypes).toEqual({
			banner: {
				sizes: [[300, 250]],
			},
			video: {
				playerSize: [
					[620, 350],
					[300, 197],
					[640, 360],
				],
				context: 'outstream',
				placement: 3,
				plcmt: 4,
			},
		});
	});
});

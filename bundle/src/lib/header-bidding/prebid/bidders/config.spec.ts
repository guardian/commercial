import type { PageTargeting } from '@guardian/commercial-core';
import {
	isInAuOrNz as isInAuOrNz_,
	isInRow as isInRow_,
	isInUk as isInUk_,
	isInUsa as isInUsa_,
	isInUsOrCa as isInUsOrCa_,
} from '@guardian/commercial-core/geo/geo-utils';
import { type ConsentState } from '@guardian/consent-manager';
import type { Size } from 'prebid.js/dist/src/types/common';
import { isUserInTestGroup } from '../../../../ab-testing';
import type { PrebidBidder } from '../../prebid-types';
import {
	containsBillboard as containsBillboard_,
	containsDmpu as containsDmpu_,
	containsLeaderboard as containsLeaderboard_,
	containsLeaderboardOrBillboard as containsLeaderboardOrBillboard_,
	containsMobileSticky as containsMobileSticky_,
	containsMpu as containsMpu_,
	containsMpuOrDmpu as containsMpuOrDmpu_,
	containsPortraitInterstitial as containsPortraitInterstitial_,
	containsWS as containsWS_,
	getBreakpointKey as getBreakpointKey_,
	shouldIncludeBidder,
	stripMobileSuffix as stripMobileSuffix_,
} from '../../utils';
import { _, bids } from './config';

const mockPageTargeting = {} as unknown as PageTargeting;

const mockConsentState = {
	tcfv2: {
		consents: { '': true },
		eventStatus: 'useractioncomplete',
		vendorConsents: { '': true },
		addtlConsent: '',
		gdprApplies: true,
		tcString: '',
	},
	gpcSignal: true,
	canTarget: true,
	framework: 'tcfv2',
} satisfies ConsentState;

const getBidders = () =>
	bids(
		'dfp-ad--top-above-nav',
		[[728, 90]],
		mockPageTargeting,
		'gpid',
		mockConsentState,
	).map((bid) => bid.bidder);

const {
	getIndexSiteIdFromConfig,
	getXaxisPlacementId,
	getTrustXAdUnitId,
	indexExchangeBidders,
	getOzonePlacementId,
	getTeadsParams,
} = _;

jest.mock('lib/page-targeting', () => ({
	buildAppNexusTargeting: () => 'someTestAppNexusTargeting',
	buildAppNexusTargetingObject: () => 'someAppNexusTargetingObject',
	getPageTargeting: () => 'bla',
}));

jest.mock('../../utils', () => ({
	...jest.requireActual('../../utils'),
	shouldIncludeBidder: jest.fn(),
	containsBillboard: jest.fn(),
	containsDmpu: jest.fn(),
	containsLeaderboard: jest.fn(),
	containsLeaderboardOrBillboard: jest.fn(),
	containsMobileSticky: jest.fn(),
	containsMpu: jest.fn(),
	containsMpuOrDmpu: jest.fn(),
	containsPortraitInterstitial: jest.fn(),
	containsWS: jest.fn(),
	getBreakpointKey: jest.fn(),
	stripMobileSuffix: jest.fn(),
}));

jest.mock('../../../../ab-testing', () => ({
	isUserInTestGroup: jest.fn(),
}));

const containsBillboard = containsBillboard_ as jest.Mock;
const containsDmpu = containsDmpu_ as jest.Mock;
const containsLeaderboard = containsLeaderboard_ as jest.Mock;
const containsLeaderboardOrBillboard =
	containsLeaderboardOrBillboard_ as jest.Mock;
const containsMobileSticky = containsMobileSticky_ as jest.Mock;
const containsMpu = containsMpu_ as jest.Mock;
const containsMpuOrDmpu = containsMpuOrDmpu_ as jest.Mock;
const containsPortraitInterstitial = containsPortraitInterstitial_ as jest.Mock;
const containsWS = containsWS_ as jest.Mock;
const stripMobileSuffix = stripMobileSuffix_ as jest.Mock;
const getBreakpointKey = getBreakpointKey_ as jest.Mock;

jest.mock('@guardian/commercial-core/geo/geo-utils');
const isInAuOrNz = isInAuOrNz_ as jest.Mock;
const isInRow = isInRow_ as jest.Mock;
const isInUk = isInUk_ as jest.Mock;
const isInUsOrCa = isInUsOrCa_ as jest.Mock;
const isInUsa = isInUsa_ as jest.Mock;

const resetConfig = () => {
	window.guardian.ophan = {
		pageViewId: 'pvid',
		viewId: 'v_id',
		record: () => {
			// do nothing;
		},
		trackComponentAttention: jest.fn(),
	};
	window.guardian.config.switches = {
		prebidAppnexus: true,
		prebidAppnexusInvcode: true,
		prebidOpenx: true,
		prebidIndexExchange: true,
		prebidTrustx: true,
		prebidXaxis: true,
		prebidTriplelift: true,
		prebidCriteo: true,
	};
	window.guardian.config.page.contentType = 'Article';
	window.guardian.config.page.section = 'Magic';
	window.guardian.config.page.isDev = false;
	window.guardian.config.page.pbIndexSites = [
		{ bp: 'D', id: 123456 },
		{ bp: 'M', id: 234567 },
		{ bp: 'T', id: 345678 },
	];
};

describe('getTrustXAdUnitId', () => {
	beforeEach(() => {
		getBreakpointKey.mockReturnValue('D');
		stripMobileSuffix.mockImplementation((str: string) => str);
	});

	afterEach(() => {
		jest.resetAllMocks();
		resetConfig();
	});

	test('should return the expected value for dfp-ad--comments', () => {
		expect(getTrustXAdUnitId('dfp-ad--comments', true)).toBe('3840');
	});

	test('should return the expected values for dfp-ad--inline10', () => {
		expect(getTrustXAdUnitId('dfp-ad--inline10', true)).toBe('3840');
		expect(getTrustXAdUnitId('dfp-ad--inline10', false)).toBe('3841');
	});

	test('should return the expected values for dfp-ad--mobile-sticky', () => {
		expect(getTrustXAdUnitId('dfp-ad--mobile-sticky', true)).toBe('8519');
	});
});

describe('indexExchangeBidders', () => {
	beforeEach(() => {
		resetConfig();
		getBreakpointKey.mockReturnValue('D');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	test('should return an IX bidder for every size that the slot can take', () => {
		const mockShouldInclude = jest.fn().mockReturnValueOnce(false);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		const slotSizes: Size[] = [
			[300, 250],
			[300, 600],
		];
		const bidders: PrebidBidder[] = indexExchangeBidders(slotSizes);
		expect(bidders).toEqual([
			expect.objectContaining<Partial<PrebidBidder>>({
				name: 'ix',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it actually works
				bidParams: expect.any(Function),
			}),
			expect.objectContaining({
				name: 'ix',
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- it works
				bidParams: expect.any(Function),
			}),
		]);
	});

	test('should include methods in the response that generate the correct bid params', () => {
		const mockShouldInclude = jest.fn().mockReturnValueOnce(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		const slotSizes: Size[] = [
			[300, 250],
			[300, 600],
		];
		const bidders: PrebidBidder[] = indexExchangeBidders(slotSizes);
		expect(bidders[0]?.bidParams('type', [[1, 2]])).toEqual({
			siteId: '123456',
			size: [300, 250],
		});
		expect(bidders[1]?.bidParams('type', [[1, 2]])).toEqual({
			siteId: '123456',
			size: [300, 600],
		});
	});
});

describe('getIndexSiteId', () => {
	afterEach(() => {
		jest.resetAllMocks();
		resetConfig();
	});

	test('should return an empty string if pbIndexSites is empty', () => {
		window.guardian.config.page.pbIndexSites = [];
		getBreakpointKey.mockReturnValue('D');
		expect(getIndexSiteIdFromConfig()).toBe('');
		expect(getIndexSiteIdFromConfig().length).toBe(0);
	});

	test('should find the correct ID for the breakpoint', () => {
		const breakpoints = ['M', 'D', 'M', 'T', 'D'];
		const results = [];
		for (let i = 0; i < breakpoints.length; i += 1) {
			getBreakpointKey.mockReturnValue(breakpoints[i]);
			results.push(getIndexSiteIdFromConfig());
		}
		expect(results).toEqual([
			'234567',
			'123456',
			'234567',
			'345678',
			'123456',
		]);
	});
});

describe('bids', () => {
	beforeEach(() => {
		resetConfig();
		containsBillboard.mockReturnValue(false);
		containsDmpu.mockReturnValue(false);
		containsLeaderboard.mockReturnValue(false);
		containsLeaderboardOrBillboard.mockReturnValue(false);
		containsMpu.mockReturnValue(false);
		containsMpuOrDmpu.mockReturnValue(false);
		stripMobileSuffix.mockImplementation((str: string) => str);
	});

	afterEach(() => {
		jest.resetAllMocks();
		jsdom.reconfigure({
			url: 'https://some.domain/path',
		});
	});

	const setQueryString = (s: string) => {
		jsdom.reconfigure({
			url: `https://some.domain/path?${s}`,
		});
	};

	test('should only include bidders that are meant to be included if no bidders being tested', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(true) // ix
			.mockReturnValueOnce(false) // criteo
			.mockReturnValueOnce(true) // trustx
			.mockReturnValueOnce(false) // triplelift
			.mockReturnValueOnce(true) // and
			.mockReturnValueOnce(false) // xhb
			.mockReturnValueOnce(true); // pubmatic
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		const bidders = getBidders();
		expect(bidders).toContain('ix');
		expect(bidders).not.toContain('criteo');
		expect(bidders).toContain('trustx');
		expect(bidders).not.toContain('triplelift');
		expect(bidders).toContain('and');
		expect(bidders).not.toContain('xhb');
		expect(bidders).toContain('pubmatic');
	});

	test('should not include ix bidders when shouldInclude returns false', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(false) // ix
			.mockReturnValueOnce(true) // criteo
			.mockReturnValueOnce(true) // trustx
			.mockReturnValueOnce(true) // triplelift
			.mockReturnValueOnce(true) // and
			.mockReturnValueOnce(true) // xhb
			.mockReturnValueOnce(true); // pubmatic
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		const bidders = getBidders();
		expect(bidders).not.toContain('ix');
		expect(bidders).toContain('criteo');
		expect(bidders).toContain('trustx');
		expect(bidders).toContain('triplelift');
		expect(bidders).toContain('and');
		expect(bidders).toContain('xhb');
		expect(bidders).toContain('pubmatic');
	});

	test('should include ix bidder for each size that slot can take', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(true) // ix
			.mockReturnValueOnce(true); // criteo
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		const rightSlotBidders = () =>
			bids(
				'dfp-right',
				[
					[300, 600],
					[300, 250],
				],
				mockPageTargeting,
				'gpid',
				mockConsentState,
			).map((bid) => bid.bidder);
		expect(rightSlotBidders()).toEqual(['ix', 'ix', 'criteo']);
	});

	test('should only include bidder being tested', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(false) // ix
			.mockReturnValueOnce(false) // criteo
			.mockReturnValueOnce(false) // trustx
			.mockReturnValueOnce(false) // triplelift
			.mockReturnValueOnce(false) // and
			.mockReturnValueOnce(true); // xhb
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['xhb']);
	});
	test('should include teadsBidder when user is in the AB Test variant', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(false) // ix
			.mockReturnValueOnce(false) // criteo
			.mockReturnValueOnce(false) // trustx
			.mockReturnValueOnce(false) // triplelift
			.mockReturnValueOnce(false) // and
			.mockReturnValueOnce(false) // xhb
			.mockReturnValueOnce(false) // pubmatic
			.mockReturnValueOnce(false) // ozone - banner
			.mockReturnValueOnce(false) // ozone - video
			.mockReturnValueOnce(false) // oxd
			.mockReturnValueOnce(false) // kargo
			.mockReturnValueOnce(true); // teads
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['teads']);
	});
	test('should NOT include teadsBidder when user is NOT in the AB Test variant', () => {
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(false) // ix
			.mockReturnValueOnce(false) // criteo
			.mockReturnValueOnce(false) // trustx
			.mockReturnValueOnce(false) // triplelift
			.mockReturnValueOnce(false) // and
			.mockReturnValueOnce(false) // xhb
			.mockReturnValueOnce(false) // pubmatic
			.mockReturnValueOnce(false) // ozone - banner
			.mockReturnValueOnce(false) // ozone - video
			.mockReturnValueOnce(false) // oxd
			.mockReturnValueOnce(false) // kargo
			.mockReturnValueOnce(false) // teads
			.mockReturnValueOnce(true); // rubicon
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['rubicon']);
	});

	test('should only include bidder being tested, even when it should not be included', () => {
		setQueryString('pbtest=xhb');
		const mockShouldInclude = jest.fn().mockReturnValue(false);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['xhb']);
	});

	test('should only include multiple bidders being tested, even when their switches are off', () => {
		setQueryString('pbtest=xhb&pbtest=oxd');
		const mockShouldInclude = jest.fn().mockReturnValue(false);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['xhb', 'oxd']);
	});

	test('should ignore bidder that does not exist', () => {
		setQueryString('pbtest=nonexistentbidder&pbtest=xhb');
		const mockShouldInclude = jest.fn().mockReturnValue(false);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);

		expect(getBidders()).toEqual(['xhb']);
	});

	test('should use correct parameters in OpenX bids geolocated in UK', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInUk.mockReturnValue(true);

		const openXBid = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((_) => _.bidder === 'oxd');
		expect(openXBid?.params).toEqual({
			customParams: 'someAppNexusTargetingObject',
			delDomain: 'guardian-d.openx.net',
			unit: '540279541',
		});
	});

	test('should use correct parameters in OpenX bids geolocated in US', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInUsOrCa.mockReturnValue(true);

		const openXBid = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((_) => _.bidder === 'oxd');
		expect(openXBid?.params).toEqual({
			customParams: 'someAppNexusTargetingObject',
			delDomain: 'guardian-us-d.openx.net',
			unit: '540279544',
		});
	});

	test('should use correct parameters in OpenX bids geolocated in AU', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInAuOrNz.mockReturnValue(true);

		const openXBid = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((_) => _.bidder === 'oxd');
		expect(openXBid?.params).toEqual({
			customParams: 'someAppNexusTargetingObject',
			delDomain: 'guardian-aus-d.openx.net',
			unit: '540279542',
		});
	});

	test('should use correct parameters in OpenX bids geolocated in FR for top-above-nav', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInRow.mockReturnValue(true);

		const openXBid = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((_) => _.bidder === 'oxd');
		expect(openXBid?.params).toEqual({
			customParams: 'someAppNexusTargetingObject',
			delDomain: 'guardian-d.openx.net',
			unit: '540279541',
		});
	});
	test('should use correct parameters in OpenX bids geolocated in FR for mobile-sticky', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInRow.mockReturnValue(true);
		containsMobileSticky.mockReturnValue(true);

		const openXBid = bids(
			'dfp-ad--mobile-sticky',
			[[320, 50]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((_) => _.bidder === 'oxd');
		expect(openXBid?.params).toEqual({
			customParams: 'someAppNexusTargetingObject',
			delDomain: 'guardian-d.openx.net',
			unit: '560429384',
		});
	});

	test('should pass inline1 slotId through to Teads params for desktop MPU in UK', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsMpu.mockReturnValue(true);

		const teadsBid = bids(
			'dfp-ad--inline1',
			[[300, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'teads');

		expect(teadsBid?.params).toEqual({
			pageId: 265029,
			placementId: 248133,
		});
	});

	test('should pass inline2 slotId through to Ozone params for mobile MPU in US', () => {
		const mockShouldInclude = jest.fn().mockReturnValue(true);
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);

		const ozoneBid = bids(
			'dfp-ad--inline2',
			[[300, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'ozone');

		expect(ozoneBid?.params).toMatchObject({
			publisherId: 'OZONEGMG0001',
			siteId: '4204204209',
			placementId: '1500001025',
		});
	});
});

describe('triplelift adapter', () => {
	beforeEach(() => {
		resetConfig();
		window.guardian.config.page.contentType = 'Article';
		const mockShouldInclude = jest
			.fn()
			.mockReturnValueOnce(false) // ix
			.mockReturnValueOnce(false) // criteo
			.mockReturnValueOnce(false) // trustx
			.mockReturnValueOnce(true); // triplelift
		jest.mocked(shouldIncludeBidder).mockReturnValue(mockShouldInclude);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	test('should include triplelift adapter if condition is true ', () => {
		expect(getBidders()).toEqual(['triplelift']);
	});

	test('should return correct triplelift adapter params for leaderboard, with requests from US or Canada', () => {
		containsLeaderboard.mockReturnValue(true);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInUsOrCa.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_topbanner_728x90_prebid',
			tagid: 'theguardian_topbanner_728x90_prebid',
		});
	});

	test('should return correct triplelift adapter params for leaderboard, with requests from Aus or NZ', () => {
		containsLeaderboard.mockReturnValue(true);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInAuOrNz.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--top-above-nav',
			[[728, 90]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_topbanner_728x90_prebid_AU',
			tagid: 'theguardian_topbanner_728x90_prebid_AU',
		});
	});

	test('should return correct triplelift adapter params for MPU, with requests from US or Canada', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValue(true);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInUsOrCa.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--inline1',
			[[300, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_sectionfront_300x250_prebid',
			tagid: 'theguardian_sectionfront_300x250_prebid',
		});
	});

	test('should return correct triplelift adapter params for MPU, with requests from Aus or NZ', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValue(true);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInAuOrNz.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--inline1',
			[[300, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_sectionfront_300x250_prebid_AU',
			tagid: 'theguardian_sectionfront_300x250_prebid_AU',
		});
	});

	test('should return correct triplelift adapter params for mobile sticky, with requests from US or Canada', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValue(true);
		isInUsOrCa.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--top-above-nav',
			[[320, 50]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_320x50_HDX',
			tagid: 'theguardian_320x50_HDX',
		});
	});

	test('should return correct triplelift adapter params for mobile sticky, with requests from Aus or NZ', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValueOnce(false);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValue(true);
		isInAuOrNz.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--top-above-nav',
			[[320, 50]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_320x50_HDX_AU',
			tagid: 'theguardian_320x50_HDX_AU',
		});
	});

	test('should return correct triplelift adapter params for billboard, with requests from US or Canada', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValue(true);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInUsOrCa.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--merchandising-high',
			[[970, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_article_970x250_prebid',
			tagid: 'theguardian_article_970x250_prebid',
		});
	});

	test('should return correct triplelift adapter params for billboard, with requests from Aus or NZ', () => {
		containsLeaderboard.mockReturnValueOnce(false);
		containsBillboard.mockReturnValue(true);
		containsMpu.mockReturnValueOnce(false);
		containsDmpu.mockReturnValueOnce(false);
		containsMobileSticky.mockReturnValueOnce(false);
		isInAuOrNz.mockReturnValue(true);

		const tripleLiftBids = bids(
			'dfp-ad--merchandising-high',
			[[970, 250]],
			mockPageTargeting,
			'gpid',
			mockConsentState,
		).find((bid) => bid.bidder === 'triplelift');
		expect(tripleLiftBids?.params).toEqual({
			inventoryCode: 'theguardian_article_970x250_prebid_AU',
			tagid: 'theguardian_article_970x250_prebid_AU',
		});
	});
});

describe('getXaxisPlacementId', () => {
	beforeEach(() => {
		resetConfig();
		getBreakpointKey.mockReturnValue('D');

		containsMpuOrDmpu
			.mockReturnValueOnce(true)
			.mockReturnValueOnce(true)
			.mockReturnValue(false);
		containsLeaderboardOrBillboard
			.mockReturnValueOnce(true)
			.mockReturnValueOnce(true)
			.mockReturnValue(false);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const generateTestIds = () => {
		const prebidSizes: Size[][] = [
			[[300, 250]],
			[[300, 600]],
			[[970, 250]],
			[[728, 90]],
			[[1, 2]],
		];
		return prebidSizes.map(getXaxisPlacementId);
	};

	test('should return the expected values for desktop device', () => {
		getBreakpointKey.mockReturnValue('D');

		expect(generateTestIds()).toEqual([
			20943665, 20943665, 20943666, 20943666, 20943668,
		]);
	});

	test('should return the expected values for tablet device', () => {
		getBreakpointKey.mockReturnValue('T');
		expect(generateTestIds()).toEqual([
			20943671, 20943671, 20943672, 20943672, 20943674,
		]);
	});

	test('should return the expected values for mobile device', () => {
		getBreakpointKey.mockReturnValue('M');
		expect(generateTestIds()).toEqual([
			20943669, 20943669, 20943670, 20943670, 20943670,
		]);
	});
});

describe('getTeadsParams', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});
	describe('UK Region', () => {
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[300, 600], 'DMPU', containsDmpu],
			[[728, 90], 'Leaderboard', containsLeaderboard],
			[[970, 250], 'Billboard', containsBillboard],
			[[160, 600], 'WS', containsWS],
		])(
			'should return correct placement and page ID for %s in UK when on desktop',
			(size, label, mockFunction) => {
				isInUk.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('D');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244722,
					placementId: 261612,
				});
			},
		);
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[320, 480], 'PORTRAIT', containsPortraitInterstitial],
		])(
			'should return correct placement and page ID for %s in UK when on mobile',
			(size, label, mockFunction) => {
				isInUk.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244724,
					placementId: 261614,
				});
			},
		);
		test('should return correct pageId and placementID for MPU sized inline1 slots, in Uk when it is on desktop', () => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValue('D');
			containsMpu.mockReturnValue(true);
			expect(
				getTeadsParams([[300, 250]], 'dfp-ad--inline1'),
			).toStrictEqual({
				pageId: 265029,
				placementId: 248133,
			});
		});
	});
	describe('Rest of World Region', () => {
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[300, 600], 'DMPU', containsDmpu],
			[[160, 600], 'WS', containsWS],
			[[728, 90], 'LEADERBOARD', containsLeaderboard],
			[[970, 250], 'BILLBOARD', containsBillboard],
		])(
			'should return correct placement and page ID for %s in RoW when on desktop',
			(size, label, mockFucntion) => {
				isInRow.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('D');
				mockFucntion.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244725,
					placementId: 261615,
				});
			},
		);
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[320, 480], 'PORTRAIT', containsPortraitInterstitial],
		])(
			'should return correct placement and page ID for %s in RoW when on mobile',
			(size, label, mockFucntion) => {
				isInRow.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFucntion.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244726,
					placementId: 261616,
				});
			},
		);
		test.each([[[320, 50], 'MOBILE STICKY', containsMobileSticky]])(
			'should return correct placement and page ID for %s in RoW when mobile sticky on mobile',
			(size, label, mockFucntion) => {
				isInRow.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFucntion.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244723,
					placementId: 261613,
				});
			},
		);
		test('should return correct pageId and placementID for MPU sized inline1 slots, in RoW when it is on desktop', () => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValue('D');
			containsMpu.mockReturnValue(true);
			expect(
				getTeadsParams([[300, 250]], 'dfp-ad--inline1'),
			).toStrictEqual({
				pageId: 265030,
				placementId: 248134,
			});
		});
	});
	describe('US Region', () => {
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[300, 600], 'DMPU', containsDmpu],
			[[160, 600], 'WS', containsWS],
			[[728, 90], 'LEADERBOARD', containsLeaderboard],
			[[970, 250], 'BILLBOARD', containsBillboard],
		])(
			'should return correct placement and page ID for %s in US when on desktop',
			(size, label, mockFunction) => {
				isInUsa.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('D');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244728,
					placementId: 261618,
				});
			},
		);
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[320, 480], 'PORTRAIT', containsPortraitInterstitial],
		])(
			'should return correct placement and page ID for %s in US when on mobile',
			(size, label, mockFunction) => {
				isInUsa.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244729,
					placementId: 261619,
				});
			},
		);
		test.each([[[320, 50], 'MOBILE STICKY', containsMobileSticky]])(
			'should return correct placement and page ID for %s in US when mobile sticky on mobile',
			(size, label, mockFunction) => {
				isInUsa.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 244730,
					placementId: 261620,
				});
			},
		);
		test('should return correct pageId and placementID for MPU sized inline1 slots, in US when it is on desktop', () => {
			isInUsa.mockReturnValue(true);
			getBreakpointKey.mockReturnValue('D');
			containsMpu.mockReturnValue(true);
			expect(
				getTeadsParams([[300, 250]], 'dfp-ad--inline1'),
			).toStrictEqual({
				pageId: 248135,
				placementId: 265031,
			});
		});
	});
	describe('AU or NZ Region', () => {
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[300, 600], 'DMPU', containsDmpu],
			[[160, 600], 'WS', containsWS],
			[[728, 90], 'LEADERBOARD', containsLeaderboard],
			[[970, 250], 'BILLBOARD', containsBillboard],
		])(
			'should return correct placement and page ID for %s in AU/NZ when on desktop',
			(size, label, mockFunction) => {
				isInAuOrNz.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('D');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 247434,
					placementId: 264330,
				});
			},
		);
		test.each([
			[[300, 250], 'MPU', containsMpu],
			[[320, 480], 'PORTRAIT', containsPortraitInterstitial],
		])(
			'should return correct placement and page ID for %s in AU/NZ when on mobile',
			(size, label, mockFunction) => {
				isInAuOrNz.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 247435,
					placementId: 264331,
				});
			},
		);
		test.each([[[320, 50], 'MOBILE STICKY', containsMobileSticky]])(
			'should return correct placement and page ID for %s in AU/NZ when mobile sticky on mobile',
			(size, label, mockFunction) => {
				isInAuOrNz.mockReturnValue(true);
				getBreakpointKey.mockReturnValue('M');
				mockFunction.mockReturnValue(true);
				expect(getTeadsParams([size as Size])).toStrictEqual({
					pageId: 247436,
					placementId: 264332,
				});
			},
		);
		test('should return correct pageId and placementId for MPU sized inline1 slots, in AU/NZ when it is on desktop', () => {
			isInAuOrNz.mockReturnValue(true);
			getBreakpointKey.mockReturnValue('D');
			containsMpu.mockReturnValue(true);
			expect(
				getTeadsParams([[300, 250]], 'dfp-ad--inline1'),
			).toStrictEqual({
				pageId: 248136,
				placementId: 265032,
			});
		});
	});
});

describe('getOzonePlacementId', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	test('should return inline1 placementID for video media type', () => {
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		containsMobileSticky.mockReturnValue(false);
		jest.mocked(isUserInTestGroup).mockReturnValueOnce(true);
		expect(
			getOzonePlacementId([[300, 250]], 'video', 'dfp-ad--inline1'),
		).toBe('1500001169');
	});

	test('should return correct placementID for billboard in US when it is in desktop', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsLeaderboardOrBillboard.mockReturnValue(true);
		expect(getOzonePlacementId([[970, 250]], 'banner')).toBe('3500010912');
	});

	test('should return correct placementID for mpu in US when it is in desktop', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsMpuOrDmpu.mockReturnValue(true);
		expect(getOzonePlacementId([[300, 250]], 'banner')).toBe('3500010911');
	});

	test('should return correct placementID for mpu in US when it is in mobile', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(getOzonePlacementId([[300, 250]], 'banner')).toBe('1500001036');
	});

	test('should return correct placementID for mobile-sticky in US', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMobileSticky.mockReturnValue(true);
		expect(getOzonePlacementId([[320, 50]], 'banner')).toBe('3500014217');
	});

	test('should return correct placementID for mobile-sticky in ROW', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMobileSticky.mockReturnValue(true);
		expect(getOzonePlacementId([[320, 50]], 'banner')).toBe('1500000260');
	});

	test('should return correct placementID for hangtime ads in inline2 in UK', () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline2'),
		).toBe('1500001025');
	});

	test('should return correct placementID for hangtime ads in inline2 in ROW', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline2'),
		).toBe('1500001025');
	});

	test('should return correct placementID for hangtime ads in inline2 in US', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline2'),
		).toBe('1500001025');
	});

	test('should return correct placementID for hangtime ads in inline2 in AUZ or NZ', () => {
		isInAuOrNz.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline2'),
		).toBe('1500001025');
	});

	test('should NOT return hangtime for non-inline2 mobile MPU slots', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		containsMobileSticky.mockReturnValue(false);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline3'),
		).toBe('1500001036');
	});

	test('should NOT return hangtime for desktop inline2 slots', () => {
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsMpuOrDmpu.mockReturnValue(true);
		expect(
			getOzonePlacementId([[300, 250]], 'banner', 'dfp-ad--inline2'),
		).toBe('3500010911'); // ← Should get desktop MPU, not hangtime
	});

	test('should return correct placementID if none of the conditions are met', () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		containsMpu.mockReturnValue(true);
		expect(getOzonePlacementId([[300, 250]], 'banner')).toBe('0420420500');
	});
});

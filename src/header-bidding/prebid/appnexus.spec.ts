import { createAdSize } from 'core/ad-sizes';
import {
	isInAuOrNz as isInAuOrNz_,
	isInRow as isInRow_,
	isInUk as isInUk_,
	isInUsa as isInUsa_,
} from 'utils/geo-utils';
import {
	containsBillboardNotLeaderboard as containsBillboardNotLeaderboard_,
	containsDmpu as containsDmpu_,
	containsLeaderboard as containsLeaderboard_,
	containsLeaderboardOrBillboard as containsLeaderboardOrBillboard_,
	containsMobileSticky as containsMobileSticky_,
	containsMpu as containsMpu_,
	containsMpuOrDmpu as containsMpuOrDmpu_,
	getBreakpointKey as getBreakpointKey_,
} from '../utils';
import { getAppNexusDirectPlacementId } from './appnexus';

jest.mock('../utils');
const containsBillboardNotLeaderboard =
	containsBillboardNotLeaderboard_ as jest.Mock;
const containsDmpu = containsDmpu_ as jest.Mock;
const containsLeaderboard = containsLeaderboard_ as jest.Mock;
const containsLeaderboardOrBillboard =
	containsLeaderboardOrBillboard_ as jest.Mock;
const containsMobileSticky = containsMobileSticky_ as jest.Mock;
const containsMpu = containsMpu_ as jest.Mock;
const containsMpuOrDmpu = containsMpuOrDmpu_ as jest.Mock;
const getBreakpointKey = getBreakpointKey_ as jest.Mock;

jest.mock('utils/geo-utils');
const isInAuOrNz = isInAuOrNz_ as jest.Mock;
const isInRow = isInRow_ as jest.Mock;
const isInUk = isInUk_ as jest.Mock;
const isInUsa = isInUsa_ as jest.Mock;

jest.mock('experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(),
}));

jest.mock('lib/cookies', () => ({
	getCookie: jest.fn(),
}));

const resetConfig = () => {
	window.guardian.ophan = {
		pageViewId: 'pvid',
		viewId: 'v_id',
		record: () => {
			// do nothing;
		},
		setEventEmitter: null,
		trackComponentAttention: null,
	};
	window.guardian.config.switches = {
		prebidAppnexus: true,
		prebidAppnexusInvcode: true,
		prebidOpenx: true,
		prebidImproveDigital: true,
		prebidIndexExchange: true,
		prebidSonobi: true,
		prebidTrustx: true,
		prebidXaxis: true,
		prebidAdYouLike: true,
		prebidTriplelift: true,
		prebidCriteo: true,
	};
	window.guardian.config.page.contentType = 'Article';
	window.guardian.config.page.section = 'Magic';
	window.guardian.config.page.isDev = false;
};

describe('getAppNexusDirectPlacementId', () => {
	afterEach(() => {
		jest.resetAllMocks();
		resetConfig();
	});

	test('should return correct placementID for any existing biding sizes in Australia or New Zealand', () => {
		isInAuOrNz.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsMpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 250)])).toBe(
			'11016434',
		);
	});

	test('should return correct placementID for mobile-sticky and in ROW', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMobileSticky.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(320, 50)])).toBe(
			'31512573',
		);
	});

	test('should return correct placementID for ad sizes not in the conditional statement and not mobile-sticky in ROW', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsDmpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 600)])).toBe(
			'9251752',
		);
	});

	test('should return correct placementID for desktop billboard not leaderboad in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsBillboardNotLeaderboard.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(970, 250)])).toBe(
			'30017511',
		);
	});

	test('should return correct placementID for desktop mpu or dmpu in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsMpuOrDmpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 600)])).toBe(
			'9251752',
		);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 250)])).toBe(
			'9251752',
		);
	});

	test('should return correct placementID for desktop billboard or leaderboard in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsLeaderboardOrBillboard.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(970, 250)])).toBe(
			'9926678',
		);
		expect(getAppNexusDirectPlacementId([createAdSize(728, 90)])).toBe(
			'9926678',
		);
	});

	test('should return correct placementID for desktop leaderboard in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		containsLeaderboard.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(728, 90)])).toBe(
			'9251752',
		);
	});

	test('should return correct placementID for tablet mpu in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		containsMpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 250)])).toBe(
			'4371641',
		);
	});

	test('should return correct placementID for tablet leaderboard in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		containsLeaderboard.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(728, 90)])).toBe(
			'4371640',
		);
	});

	test('should return correct placementID for tablet dmpu in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		containsDmpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 600)])).toBe(
			'9251752',
		);
	});

	test('should return correct placementID for mobile mpu in UK, ROW and US', () => {
		isInUk.mockReturnValue(true);
		isInRow.mockReturnValue(true);
		isInUsa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		containsMpu.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(300, 250)])).toBe(
			'4298191',
		);
	});

	test('should return correct placementID for mobile-sticky in US', () => {
		isInUsa.mockReturnValue('true');
		getBreakpointKey.mockReturnValue('M');
		containsMobileSticky.mockReturnValue(true);
		expect(getAppNexusDirectPlacementId([createAdSize(320, 50)])).toBe(
			'9251752',
		);
	});
});

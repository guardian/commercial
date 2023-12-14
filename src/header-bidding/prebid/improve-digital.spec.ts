import { createAdSize } from 'core';
import {
	isInAuOrNz as isInAuOrNz_,
	isInRow as isInRow_,
	isInUk as isInUk_,
	isInUsOrCa as isInUsOrCa_,
} from 'utils/geo-utils';
import { getBreakpointKey as getBreakpointKey_ } from '../utils';
import {
	getImprovePlacementId,
	getImproveSkinPlacementId,
} from './improve-digital';

const getBreakpointKey = getBreakpointKey_ as jest.Mock;
const isInAuOrNz = isInAuOrNz_ as jest.Mock;
const isInRow = isInRow_ as jest.Mock;
const isInUk = isInUk_ as jest.Mock;
const isInUsOrCa = isInUsOrCa_ as jest.Mock;

jest.mock('experiments/ab', () => ({
	isInVariantSynchronous: jest.fn(),
}));
jest.mock('utils/geo-utils');

jest.mock('../utils', () => ({
	...jest.requireActual('../utils'),
	getBreakpointKey: jest.fn(),
}));

describe('getImprovePlacementId', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: 22987847 },
		{ sizes: [createAdSize(728, 90)], expectedId: 1116397 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 1116397,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116396 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116396 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in UK on desktop case %p gives correct placement id',
		({ sizes, expectedId }) => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: 1116399 },
		{ sizes: [createAdSize(728, 90)], expectedId: 1116399 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 1116399,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116398 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116398 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in UK and on tablet %p returns correct placement id',
		({ sizes, expectedId }) => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('T');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: -1 },
		{ sizes: [createAdSize(728, 90)], expectedId: -1 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: -1,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116400 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116400 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in UK and on mobile %p returns correct placement id',
		({ sizes, expectedId }) => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: 1116421 },
		{ sizes: [createAdSize(728, 90)], expectedId: 1116421 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 1116421,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116420 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116420 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in ROW and on desktop %p returns correct placement id',
		({ sizes, expectedId }) => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: 1116423 },
		{ sizes: [createAdSize(728, 90)], expectedId: 1116423 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 1116423,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116422 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116422 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in ROW and on tablet %p returns correct placement id',
		({ sizes, expectedId }) => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('T');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		{ sizes: [createAdSize(970, 250)], expectedId: -1 },
		{ sizes: [createAdSize(728, 90)], expectedId: -1 },
		{
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: -1,
		},
		{ sizes: [createAdSize(300, 250)], expectedId: 1116424 },
		{ sizes: [createAdSize(300, 600)], expectedId: 1116424 },
		{ sizes: [createAdSize(1, 2)], expectedId: -1 },
	])(
		'in ROW and on mobile %p returns correct placement id',
		({ sizes, expectedId }) => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getImprovePlacementId(sizes)).toBe(expectedId);
		},
	);

	test.each([
		[[createAdSize(970, 250)]],
		[[createAdSize(728, 90)]],
		[[createAdSize(728, 90), createAdSize(970, 250)]],
		[[createAdSize(300, 250)]],
		[[createAdSize(300, 600)]],
		[[createAdSize(1, 2)]],
	])('in US returns placement id -1', (sizes) => {
		isInUsOrCa.mockReturnValue(true);
		expect(getImprovePlacementId(sizes)).toBe(-1);
	});

	test.each([
		[[createAdSize(970, 250)]],
		[[createAdSize(728, 90)]],
		[[createAdSize(728, 90), createAdSize(970, 250)]],
		[[createAdSize(300, 250)]],
		[[createAdSize(300, 600)]],
		[[createAdSize(1, 2)]],
	])('in AUS returns placement id -1', (sizes) => {
		isInAuOrNz.mockReturnValue(true);
		expect(getImprovePlacementId(sizes)).toBe(-1);
	});
});

describe('getImproveSkinPlacementId', () => {
	beforeEach(() => {
		getBreakpointKey.mockReturnValue('D');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const ID_UK = 22526482;
	const ID_ROW = 22526483;

	test(`should return ${ID_UK} if in the UK`, () => {
		isInUk.mockReturnValue(true);
		expect(getImproveSkinPlacementId()).toBe(ID_UK);
	});

	test(`should return ${ID_UK} when geolocated in UK and on desktop device`, () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getImproveSkinPlacementId()).toEqual(ID_UK);
	});

	test('should return -1 when geolocated in UK and on tablet device', () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		expect(getImproveSkinPlacementId()).toEqual(-1);
	});

	test('should return -1 values when geolocated in UK and on mobile device', () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getImproveSkinPlacementId()).toEqual(-1);
	});

	test(`should return ${ID_ROW} when geolocated in ROW region and on desktop device`, () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getImproveSkinPlacementId()).toEqual(ID_ROW);
	});

	test('should return -1 when geolocated in ROW region and on tablet device', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('T');
		expect(getImproveSkinPlacementId()).toEqual(-1);
	});

	test('should return -1 when geolocated in ROW region and on mobile device', () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getImproveSkinPlacementId()).toEqual(-1);
	});

	test('should return -1 if geolocated in US or AU regions', () => {
		isInUsOrCa.mockReturnValue(true);
		expect(getImproveSkinPlacementId()).toEqual(-1);
		isInAuOrNz.mockReturnValue(true);
		expect(getImproveSkinPlacementId()).toEqual(-1);
	});
});

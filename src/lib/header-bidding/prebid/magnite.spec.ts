import {
	isInAuOrNz as isInAuOrNz_,
	isInRow as isInRow_,
	isInUk as isInUk_,
	isInUsOrCa as isInUsOrCa_,
} from '@guardian/commercial/geo/geo-utils';
import { createAdSize } from '@guardian/commercial/ad-sizes';
import { getBreakpointKey as getBreakpointKey_ } from '../utils';
import { getMagniteSiteId, getMagniteZoneId } from './magnite';

const getBreakpointKey = getBreakpointKey_ as jest.Mock;
const isInAuOrNz = isInAuOrNz_ as jest.Mock;
const isInRow = isInRow_ as jest.Mock;
const isInUk = isInUk_ as jest.Mock;
const isInUsOrCa = isInUsOrCa_ as jest.Mock;

jest.mock('experiments/ab', () => ({
	isUserInVariant: jest.fn(),
}));
jest.mock('@guardian/commercial/geo/geo-utils');

jest.mock('../utils', () => ({
	...jest.requireActual('../utils'),
	getBreakpointKey: jest.fn(),
}));

describe('getMagniteZoneId', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	test.each([
		{
			slotId: 'dfp-ad--comments-expanded',
			sizes: [createAdSize(160, 600)],
			expectedId: 3426780,
		},
		{
			slotId: 'dfp-ad--inline3',
			sizes: [createAdSize(300, 250), createAdSize(300, 600)],
			expectedId: 3426780,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 3426786,
		},
		{
			slotId: 'dfp-ad--fronts-banner-3',
			sizes: [createAdSize(970, 250)],
			expectedId: 3426790,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(940, 230)],
			expectedId: -1,
		},
	])(
		'in UK on desktop case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--top-above-nav--mobile',
			sizes: [createAdSize(300, 250), createAdSize(320, 480)],
			expectedId: 3426778,
		},
		{
			slotId: 'dfp-ad--merchandising-high',
			sizes: [createAdSize(300, 197)],
			expectedId: -1,
		},
	])(
		'in UK on mobile case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInUk.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--comments-expanded',
			sizes: [createAdSize(160, 600)],
			expectedId: 3426822,
		},
		{
			slotId: 'dfp-ad--inline3',
			sizes: [createAdSize(300, 250), createAdSize(300, 600)],
			expectedId: 3426822,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 3426828,
		},
		{
			slotId: 'dfp-ad--fronts-banner-3',
			sizes: [createAdSize(970, 250)],
			expectedId: 3426834,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(940, 230)],
			expectedId: -1,
		},
	])(
		'in ROW on desktop case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--top-above-nav--mobile',
			sizes: [createAdSize(300, 250), createAdSize(320, 480)],
			expectedId: 3426836,
		},
		{
			slotId: 'dfp-ad--mobile-sticky',
			sizes: [createAdSize(320, 50)],
			expectedId: 3477560,
		},
		{
			slotId: 'dfp-ad--merchandising-high',
			sizes: [createAdSize(300, 197)],
			expectedId: -1,
		},
	])(
		'in ROW on mobile case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInRow.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--comments-expanded',
			sizes: [createAdSize(160, 600)],
			expectedId: 3471422,
		},
		{
			slotId: 'dfp-ad--inline3',
			sizes: [createAdSize(300, 250), createAdSize(300, 600)],
			expectedId: 3471422,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 3471428,
		},
		{
			slotId: 'dfp-ad--fronts-banner-3',
			sizes: [createAdSize(970, 250)],
			expectedId: 3471434,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(940, 230)],
			expectedId: -1,
		},
	])(
		'in US on desktop case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInUsOrCa.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--top-above-nav--mobile',
			sizes: [createAdSize(300, 250), createAdSize(320, 480)],
			expectedId: 3471436,
		},
		{
			slotId: 'dfp-ad--mobile-sticky',
			sizes: [createAdSize(320, 50)],
			expectedId: 3471440,
		},
		{
			slotId: 'dfp-ad--merchandising-high',
			sizes: [createAdSize(300, 197)],
			expectedId: -1,
		},
	])(
		'in US on mobile case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInUsOrCa.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--comments-expanded',
			sizes: [createAdSize(160, 600)],
			expectedId: 3471452,
		},
		{
			slotId: 'dfp-ad--inline3',
			sizes: [createAdSize(300, 250), createAdSize(300, 600)],
			expectedId: 3471452,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(728, 90), createAdSize(970, 250)],
			expectedId: 3471458,
		},
		{
			slotId: 'dfp-ad--fronts-banner-3',
			sizes: [createAdSize(970, 250)],
			expectedId: 3471462,
		},
		{
			slotId: 'dfp-ad--top-above-nav',
			sizes: [createAdSize(940, 230)],
			expectedId: -1,
		},
	])(
		'in AUS on desktop case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInAuOrNz.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('D');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);

	test.each([
		{
			slotId: 'dfp-ad--top-above-nav--mobile',
			sizes: [createAdSize(300, 250), createAdSize(320, 480)],
			expectedId: 3471464,
		},
		{
			slotId: 'dfp-ad--mobile-sticky',
			sizes: [createAdSize(320, 50)],
			expectedId: 3471468,
		},
		{
			slotId: 'dfp-ad--merchandising-high',
			sizes: [createAdSize(300, 197)],
			expectedId: -1,
		},
	])(
		'in AUS on mobile case %p gives correct zone id',
		({ sizes, slotId, expectedId }) => {
			isInAuOrNz.mockReturnValue(true);
			getBreakpointKey.mockReturnValueOnce('M');
			expect(getMagniteZoneId(slotId, sizes)).toBe(expectedId);
		},
	);
});

describe('getMagniteSiteId', () => {
	beforeEach(() => {
		getBreakpointKey.mockReturnValue('D');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	test(`should return the correct siteId in UK on desktop`, () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getMagniteSiteId()).toBe(549358);
	});

	test(`should return the correct siteId in UK on mobile`, () => {
		isInUk.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getMagniteSiteId()).toBe(549374);
	});

	test(`should return the correct siteId in ROW on desktop`, () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getMagniteSiteId()).toBe(549496);
	});

	test(`should return the correct siteId in ROW on mobile`, () => {
		isInRow.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getMagniteSiteId()).toBe(549498);
	});

	test(`should return the correct siteId in US on desktop`, () => {
		isInUsOrCa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getMagniteSiteId()).toBe(554244);
	});

	test(`should return the correct siteId in US on mobile`, () => {
		isInUsOrCa.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getMagniteSiteId()).toBe(554248);
	});

	test(`should return the correct siteId in AUS on desktop`, () => {
		isInAuOrNz.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('D');
		expect(getMagniteSiteId()).toBe(554256);
	});

	test(`should return the correct siteId in AUS on mobile`, () => {
		isInAuOrNz.mockReturnValue(true);
		getBreakpointKey.mockReturnValue('M');
		expect(getMagniteSiteId()).toBe(554258);
	});
});

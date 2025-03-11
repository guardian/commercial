import { type ConsentState, getConsentFor, isString } from '@guardian/libs';
import { once } from 'lodash-es';
import { isUserInVariant } from '../../experiments/ab';
import { prebidBidCache } from '../../experiments/tests/prebid-bid-cache';
import { createAdSize } from '../../lib/ad-sizes';
import {
	isInAuOrNz,
	isInCanada,
	isInUk,
	isInUsa,
	isInUsOrCa,
} from '../../lib/geo/geo-utils';
import { pbTestNameMap } from '../../lib/url';
import {
	getCurrentTweakpoint,
	matchesBreakpoints,
} from '../detect/detect-breakpoint';
import type { HeaderBiddingSize } from './prebid-types';

type StringManipulation = (a: string, b: string) => string;
type RegExpRecords = Record<string, RegExp | undefined>;

const SUFFIX_REGEXPS: RegExpRecords = {};
const stripSuffix: StringManipulation = (s, suffix) => {
	const re =
		SUFFIX_REGEXPS[suffix] ??
		(SUFFIX_REGEXPS[suffix] = new RegExp(`${suffix}$`));
	return s.replace(re, '');
};

const PREFIX_REGEXPS: RegExpRecords = {};
const stripPrefix: StringManipulation = (s, prefix) => {
	const re =
		PREFIX_REGEXPS[prefix] ??
		(PREFIX_REGEXPS[prefix] = new RegExp(`^${prefix}`));
	return s.replace(re, '');
};

const contains = (
	sizes: HeaderBiddingSize[],
	size: HeaderBiddingSize,
): boolean => Boolean(sizes.find((s) => s[0] === size[0] && s[1] === size[1]));

const isValidPageForMobileSticky = (): boolean => {
	const { contentType, pageId } = window.guardian.config.page;
	return (
		contentType === 'Article' ||
		contentType === 'Interactive' ||
		pageId.startsWith('football/')
	);
};

/**
 * Cleans an object for targetting. Removes empty strings and other falsy values.
 * @param o object with falsy values
 * @returns {Record<string, string | string[]>} object with only non-empty strings, or arrays of non-empty strings.
 */
export const removeFalsyValues = <O extends Record<string, unknown>>(
	o: O,
): Record<string, string | string[]> =>
	Object.entries(o).reduce<Record<string, string | string[]>>(
		(prev, curr) => {
			const [key, val] = curr;
			if (!val) return prev;

			if (isString(val)) {
				prev[key] = val;
			}
			if (
				Array.isArray(val) &&
				val.length > 0 &&
				val.some(Boolean) &&
				val.every(isString)
			) {
				prev[key] = val.filter(Boolean);
			}

			return prev;
		},
		{},
	);

export const stripDfpAdPrefixFrom = (s: string): string =>
	stripPrefix(s, 'dfp-ad--');

export const containsMpu = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(300, 250));

export const containsDmpu = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(300, 600));

export const containsLeaderboard = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(728, 90));

export const containsBillboard = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(970, 250));

export const containsBillboardNotLeaderboard = (
	sizes: HeaderBiddingSize[],
): boolean => containsBillboard(sizes) && !containsLeaderboard(sizes);

export const containsMpuOrDmpu = (sizes: HeaderBiddingSize[]): boolean =>
	containsMpu(sizes) || containsDmpu(sizes);

export const containsMobileSticky = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(320, 50));

export const containsLeaderboardOrBillboard = (
	sizes: HeaderBiddingSize[],
): boolean => containsLeaderboard(sizes) || containsBillboard(sizes);

export const containsPortraitInterstitial = (
	sizes: HeaderBiddingSize[],
): boolean => contains(sizes, createAdSize(320, 480));

export const getLargestSize = (
	sizes: HeaderBiddingSize[],
): HeaderBiddingSize | null => {
	const reducer = (
		previous: HeaderBiddingSize,
		current: HeaderBiddingSize,
	) => {
		if (previous[0] >= current[0] && previous[1] >= current[1]) {
			return previous;
		}
		return current;
	};
	return sizes.length > 0 ? sizes.reduce(reducer) : null;
};

export const getBreakpointKey = (): string => {
	switch (getCurrentTweakpoint()) {
		case 'mobile':
		case 'mobileMedium':
		case 'mobileLandscape':
			return 'M';

		case 'phablet':
		case 'tablet':
			return 'T';

		case 'desktop':
		case 'leftCol':
		case 'wide':
			return 'D';

		default:
			return 'M';
	}
};

export const getRandomIntInclusive = (
	minimum: number,
	maximum: number,
): number => {
	const min = Math.ceil(minimum);
	const max = Math.floor(maximum);
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const isSwitchedOn = (switchName: string): boolean =>
	window.guardian.config.switches[switchName] ?? false;

export const shouldIncludeOpenx = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidOpenx') &&
	getConsentFor('openX', consentState) &&
	!isInUsOrCa();

export const shouldIncludeTrustX = (): boolean =>
	isSwitchedOn('prebidTrustx') && isInUsOrCa();

export const shouldIncludeTripleLift = (): boolean =>
	isSwitchedOn('prebidTriplelift') && (isInUsOrCa() || isInAuOrNz());

// TODO: Check is we want regional restrictions on where we load the ozoneBidAdapter
export const shouldIncludeOzone = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidOzone') &&
	getConsentFor('ozone', consentState) &&
	!isInCanada() &&
	!isInAuOrNz();

export const shouldIncludeAppNexus = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidAppnexus') &&
	(isInAuOrNz() ||
		(isSwitchedOn('prebidAppnexusUkRow') &&
			getConsentFor('xandr', consentState) &&
			!isInUsOrCa()) ||
		!!pbTestNameMap().and);

export const shouldIncludeXaxis = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidXaxis') &&
	getConsentFor('xandr', consentState) &&
	isInUk();

export const shouldIncludeKargo = (): boolean =>
	isSwitchedOn('prebidKargo') && isInUsa();

export const shouldIncludeMagnite = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidMagnite') && getConsentFor('magnite', consentState);

export const shouldIncludeCriteo = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidCriteo') && getConsentFor('criteo', consentState);

export const shouldIncludePubmatic = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidPubmatic') && getConsentFor('pubmatic', consentState);

export const shouldIncludeAdYouLike = (consentState: ConsentState): boolean =>
	isSwitchedOn('prebidAdYouLike') && getConsentFor('adYouLike', consentState);

export const shouldIncludeTheTradeDesk = (
	consentState: ConsentState,
): boolean =>
	isSwitchedOn('prebidTheTradeDesk') &&
	getConsentFor('theTradeDesk', consentState);

export const shouldIncludeIndexExchange = (
	consentState: ConsentState,
): boolean =>
	isSwitchedOn('prebidIndexExchange') &&
	getConsentFor('indexExchange', consentState);

export const shouldIncludePermutive = (consentState: ConsentState): boolean =>
	isSwitchedOn('permutive') &&
	/** this switch specifically controls whether or not the Permutive Audience Connector can run with Prebid */
	isSwitchedOn('prebidPermutiveAudience') &&
	getConsentFor('permutive', consentState);

export const shouldIncludeMobileSticky = once(
	(): boolean =>
		window.location.hash.includes('#mobile-sticky') ||
		(matchesBreakpoints({
			min: 'mobile',
			max: 'mobileLandscape',
		}) &&
			!isInUk() &&
			isValidPageForMobileSticky() &&
			!window.guardian.config.page.isHosted),
);

export const stripMobileSuffix = (s: string): string =>
	stripSuffix(stripSuffix(s, '--mobile'), 'Mobile');

export const stripTrailingNumbersAbove1 = (s: string): string =>
	stripSuffix(s, '([2-9]|\\d{2,})');

export const containsWS = (sizes: HeaderBiddingSize[]): boolean =>
	contains(sizes, createAdSize(160, 600));

export const shouldIncludeOnlyA9 = window.location.hash.includes('#only-a9');

export const shouldIncludePrebidBidCache = (): boolean =>
	isSwitchedOn('prebidBidCache') &&
	isUserInVariant(prebidBidCache, 'variant');

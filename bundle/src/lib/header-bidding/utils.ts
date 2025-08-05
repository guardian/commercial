import { createAdSize } from '@guardian/commercial-core/ad-sizes';
import {
	isInAuOrNz,
	isInCanada,
	isInUk,
	isInUsa,
	isInUsOrCa,
} from '@guardian/commercial-core/geo/geo-utils';
import { type ConsentState, getConsentFor, isString } from '@guardian/libs';
import { once } from 'lodash-es';
import { isUserInVariant } from '../../experiments/ab';
import { prebidAdUnit } from '../../experiments/tests/prebid-ad-unit';
import {
	getCurrentTweakpoint,
	matchesBreakpoints,
} from '../detect/detect-breakpoint';
import { pbTestNameMap } from '../url';
import type { BidderCode, HeaderBiddingSize } from './prebid-types';

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

export const shouldIncludeBidder =
	(consentState: ConsentState) =>
	(bidder: BidderCode): boolean => {
		switch (bidder) {
			case 'and':
				return (
					isSwitchedOn('prebidAppnexus') &&
					(isInAuOrNz() ||
						(isSwitchedOn('prebidAppnexusUkRow') &&
							getConsentFor('xandr', consentState) &&
							!isInUsOrCa()) ||
						!!pbTestNameMap().and)
				);
			case 'criteo':
				return (
					isSwitchedOn('prebidCriteo') &&
					getConsentFor('criteo', consentState)
				);
			case 'ix':
				return (
					isSwitchedOn('prebidIndexExchange') &&
					getConsentFor('indexExchange', consentState)
				);
			case 'kargo':
				return isSwitchedOn('prebidKargo') && isInUsa();
			case 'oxd':
				return (
					isSwitchedOn('prebidOpenx') &&
					getConsentFor('openX', consentState) &&
					!isInUsOrCa()
				);
			case 'ozone':
				return (
					isSwitchedOn('prebidOzone') &&
					getConsentFor('ozone', consentState) &&
					!isInCanada() &&
					!isInAuOrNz()
				);
			case 'pubmatic':
				return (
					isSwitchedOn('prebidPubmatic') &&
					getConsentFor('pubmatic', consentState)
				);
			case 'rubicon':
				return (
					isSwitchedOn('prebidMagnite') &&
					getConsentFor('magnite', consentState)
				);
			case 'triplelift':
				return (
					isSwitchedOn('prebidTriplelift') &&
					(isInUsOrCa() || isInAuOrNz())
				);
			case 'trustx':
				return isSwitchedOn('prebidTrustx') && isInUsOrCa();
			case 'ttd':
				return (
					isSwitchedOn('prebidTheTradeDesk') &&
					getConsentFor('theTradeDesk', consentState)
				);
			case 'xhb':
				return (
					isSwitchedOn('prebidXaxis') &&
					getConsentFor('xandr', consentState) &&
					isInUk()
				);
		}
	};

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

export const shouldIncludePrebidAdUnit =
	isSwitchedOn('prebidBidCache') && isUserInVariant(prebidAdUnit, 'variant');

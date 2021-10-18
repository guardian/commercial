/* istanbul ignore file -- there's no point check this for test coverage */

export { ias } from './third-party-tags/ias';
export { permutive } from './third-party-tags/permutive';
export { fbPixel } from './third-party-tags/facebook-pixel';
export { twitter } from './third-party-tags/twitter-uwt';
export { inizio } from './third-party-tags/inizio';
export { remarketing } from './third-party-tags/remarketing';
export { EventTimer } from './EventTimer';
export { sendCommercialMetrics } from './sendCommercialMetrics';
export type { ThirdPartyTag } from './types';
export { adSizes } from './ad-sizes';
export type { SizeKeys, AdSizeString, AdSize } from './ad-sizes';
export { isAdBlockInUse } from './detectAdBlocker';
export {
	clearPermutiveSegments,
	getPermutiveSegments,
	getPermutivePFPSegments,
} from './permutive';
export { buildAdsConfigWithConsent, disabledAds } from './ad-targeting-youtube';
export type {
	AdsConfig,
	AdsConfigBasic,
	AdsConfigDisabled,
	AdTargetingBuilder,
} from './types';

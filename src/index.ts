/* istanbul ignore file -- there's no point check this for test coverage */

export { ias } from './third-party-tags/ias';
export { permutive } from './third-party-tags/permutive';
export { fbPixel } from './third-party-tags/facebook-pixel';
export { twitter } from './third-party-tags/twitter-uwt';
export { inizio } from './third-party-tags/inizio';
export { remarketing } from './third-party-tags/remarketing';
export { EventTimer } from './event-timer';
export {
	bypassCommercialMetricsSampling,
	initCommercialMetrics,
} from './send-commercial-metrics';
export type { ThirdPartyTag } from './types';
export { adSizes, getAdSize, slotSizeMappings, createAdSize } from './ad-sizes';
export { isBreakpoint } from './lib/breakpoint';
export type { Breakpoint } from './lib/breakpoint';
export type {
	SizeKeys,
	AdSizeString,
	AdSize,
	SizeMapping,
	SlotSizeMappings,
	SlotName,
} from './ad-sizes';
export { isAdBlockInUse } from './detect-ad-blocker';
export {
	clearPermutiveSegments,
	getPermutiveSegments,
	getPermutivePFPSegments,
} from './permutive';
export { initTrackScrollDepth } from './track-scroll-depth';
export { initTrackLabsContainer } from './track-labs-container';
export { initTrackGpcSignal } from './track-gpc-signal';
export { buildAdsConfigWithConsent, disabledAds } from './ad-targeting-youtube';
export { createAdSlot, concatSizeMappings } from './create-ad-slot';
export type {
	AdsConfig,
	AdsConfigBasic,
	AdsConfigDisabled,
	AdTargetingBuilder,
	CustomParams,
} from './types';
export * as constants from './constants';
export type { ContentTargeting } from './targeting/content';
export { getContentTargeting } from './targeting/content';
export type { PersonalisedTargeting } from './targeting/personalised';
export { getPersonalisedTargeting } from './targeting/personalised';
export type { SessionTargeting } from './targeting/session';
export { getSessionTargeting } from './targeting/session';
export type { SharedTargeting } from './targeting/shared';
export { getSharedTargeting } from './targeting/shared';
export type { ViewportTargeting } from './targeting/viewport';
export { getViewportTargeting } from './targeting/viewport';
export { pickTargetingValues } from './targeting/pick-targeting-values';

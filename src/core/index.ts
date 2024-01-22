/* istanbul ignore file -- there's no point check this for test coverage */

export { ias } from './third-party-tags/ias';
export { permutive } from './third-party-tags/permutive';
export { twitter } from './third-party-tags/twitter-uwt';
export { inizio } from './third-party-tags/inizio';
export { remarketing } from './third-party-tags/remarketing';
export { EventTimer } from './event-timer';
export {
	bypassCommercialMetricsSampling,
	initCommercialMetrics,
} from './send-commercial-metrics';
export type { ThirdPartyTag } from './types';
export {
	adSizes,
	createAdSize,
	getAdSize,
	outstreamSizes,
	slotSizeMappings,
	standardAdSizes,
} from './ad-sizes';
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
export { initTrackGpcSignal } from './track-gpc-signal';
export { buildAdsConfigWithConsent, disabledAds } from './targeting/youtube';
export { createAdSlot, concatSizeMappings } from '../core/create-ad-slot';
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
export { init as initMessenger } from './messenger';
export type {
	RegisterListener,
	RegisterPersistentListener,
	RespondProxy,
} from './messenger';
export { postMessage } from './messenger/post-message';
export { buildPageTargeting } from './targeting/build-page-targeting';
export { buildPageTargetingConsentless } from './targeting/build-page-targeting-consentless';
export type { PageTargeting } from './targeting/build-page-targeting';
/* -- Vendor JavaScript -- */
export { a9Apstag } from './__vendor/a9-apstag';
export { ipsosMoriStub } from './__vendor/ipsos-mori';
export { launchpad } from './__vendor/launchpad';
export { pubmatic } from './__vendor/pubmatic';
export { buildImaAdTagUrl } from './targeting/youtube-ima';

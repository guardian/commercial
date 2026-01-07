import type { AnalyticsConfig, PrebidEvent } from '../prebid-types';
import type { PrebidAdUnit } from './prebid-ad-unit';
import type {
	BidderSettings,
	PbjsBidderConfig,
	PbjsConfig,
	PbjsEvent,
	PbjsEventHandler,
} from './types';

declare global {
	interface Window {
		// liveramp ats object is available once liveramp ats-module script is loaded
		atsenvelopemodule?: {
			setAdditionalData: (data: { type: string; id: string[] }) => void;
		};
		// the optional pbjs object causes a typecheck failure as the v10
		// window.pbjs is not optional, so the compiler complains that the
		// modifiers are not identical. restore this if we migrate back to prebid v9.x
		// pbjs?: {
		pbjs: {
			que: {
				push: (cb: () => void) => void;
			};
			addAdUnits: (adUnits: PrebidAdUnit[]) => void;
			/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/requestBids.html */
			requestBids(requestObj?: {
				adUnitCodes?: string[];
				adUnits?: PrebidAdUnit[];
				timeout?: number;
				bidsBackHandler?: (
					bidResponses: unknown,
					timedOut: boolean,
					auctionId: string,
				) => void;
				labels?: string[];
				auctionId?: string;
			}): void;
			setConfig: (config: PbjsConfig) => void;
			setBidderConfig: (bidderConfig: {
				bidders: BidderCode[];
				config: PbjsBidderConfig;
			}) => void;
			getConfig: (item?: string) => PbjsConfig & {
				dataProviders: Array<{
					name: string;
					params: {
						acBidders: BidderCode[];
					};
				}>;
			};
			bidderSettings: BidderSettings;
			enableAnalytics: (arg0: [AnalyticsConfig]) => void;
			onEvent: (event: PbjsEvent, handler: PbjsEventHandler) => void;
			setTargetingForGPTAsync: (
				codeArr?: string[],
				customSlotMatching?: (slot: unknown) => unknown,
			) => void;
			getEvents: () => PrebidEvent[];
		};
	}
}

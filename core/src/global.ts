import type { EventTimer } from './event-timer';
import type { SharedTargeting } from './targeting/shared';
import type { Edition, NetworkInformation } from './types';

declare global {
	interface Navigator {
		readonly connection?: NetworkInformation;
		readonly cookieDeprecationLabel?: {
			getValue: () => Promise<string>;
		};
	}

	interface Window {
		guardian: {
			commercialTimer?: EventTimer;
			offlineCount?: number;

			config: {
				isDotcomRendering: boolean;
				ophan: { pageViewId: string };
				shouldSendCommercialMetrics: boolean;
				commercialMetricsInitialised: boolean;
				page: {
					dcrCouldRender: boolean;
					edition: Edition;
					isPreview: boolean;
					isSensitive: boolean;
					pageId: string;
					section: string;
					videoDuration: number;
					webPublicationDate: number;
					sharedAdTargeting?: SharedTargeting;
					host: string;
					contentType:
						| 'Article'
						| 'Video'
						| 'Audio'
						| 'LiveBlog'
						| 'Interactive'
						| 'Gallery';
				};
				tests?: {
					[key: `${string}Control`]: 'control';
					[key: `${string}Variant`]: 'variant';
				};
			};
		};
	}
}

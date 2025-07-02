export type ConnectionType =
	| 'bluetooth'
	| 'cellular'
	| 'ethernet'
	| 'mixed'
	| 'none'
	| 'other'
	| 'unknown'
	| 'wifi';

export interface NetworkInformation extends EventTarget {
	readonly type?: ConnectionType;
	readonly downlink?: number;
	readonly effectiveType?: string;
}

export type OphanRecordFunction = (
	event: Record<string, unknown> & {
		/**
		 * the experiences key will override previously set values.
		 * Use `recordExperiences` instead.
		 */
		experiences?: never;
	},
	callback?: () => void,
) => void;

/**
 * Generates a type which represents possible indices of this array
 *
 * Example usage:
 * const list = ['foo', 'bar', 'baz'] as const;
 * type Test = Indices<typeof list>
 */
export type Indices<T extends readonly unknown[]> = Exclude<
	Partial<T>['length'],
	T['length']
>;

export type Edition = 'UK' | 'AU' | 'US'; // https://github.com/guardian/frontend/blob/b952f6b9/common/app/views/support/JavaScriptPage.scala#L79

// export interface IAdvert {
// 	id: string;
// 	node: HTMLElement;
// 	sizes: SizeMapping;
// 	headerBiddingSizes: HeaderBiddingSize[] | null;
// 	size: AdSize | 'fluid' | null;
// 	slot: googletag.Slot;
// 	isEmpty: boolean | null;
// 	isRendered: boolean;
// 	shouldRefresh: boolean;
// 	whenSlotReady: Promise<void>;
// 	extraNodeClasses: string[];
// 	hasPrebidSize: boolean;
// 	headerBiddingBidRequest: Promise<unknown> | null;
// 	lineItemId: number | null;
// 	creativeId: number | null;
// 	creativeTemplateId: number | null;
// 	testgroup: string | undefined; //Ozone testgroup property

// 	finishedRendering(isRendered: boolean): void;
// 	updateExtraSlotClasses(...newClasses: string[]): Promise<void>;
// 	updateSizeMapping(additionalSizeMapping: SizeMapping): void;
// 	generateSizeMapping(additionalSizeMapping: SizeMapping): SizeMapping;
// 	updateSizeMapping(additionalSizeMapping: SizeMapping): void;
// }

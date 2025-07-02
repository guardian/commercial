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

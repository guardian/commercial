export type TargetingRule = { key: string; value: Set<string> };

export type Asset = {
	id: string;
	path: string;
	clickThroughUrl: string;
	width?: number;
	height?: number;
};

export type GuElement = {
	id: string;
	targeting: TargetingRule[];
	assets: Asset[];
};

/**
 * The type of the serialized payload that describes the elements to select
 */
export type SerializedPayload = Array<{
	id: string;
	targeting: Array<{
		key: string;
		// Here multiple values may occupy the same string, but are comma separated
		// e.g. `sport,culture`
		value: string;
	}>;
	assets: Asset[];
}>;

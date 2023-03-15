export type TargetingRule = { key: string; value: Set<string> };

export type TargetingRules = TargetingRule[];

export type Asset = {
	id: string;
	path: string;
	clickThroughUrl: string;
	width?: number;
	height?: number;
};

export type GuElement = {
	id: string;
	targeting: TargetingRules;
	assets: Asset[];
};

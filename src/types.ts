export type TagAtrribute = {
	name: string;
	value: string;
};

export type GetThirdPartyTag = (arg0: {
	shouldRun: boolean;
	facebookAccountId?: string;
}) => ThirdPartyTag;

export type ThirdPartyTag = {
	async?: boolean;
	attrs?: Array<TagAtrribute>;
	beforeLoad?: () => void;
	insertSnippet?: () => void;
	loaded?: boolean;
	onLoad?: () => void;
	shouldRun: boolean;
	name?: string;
	url?: string;
	useImage?: boolean;
};

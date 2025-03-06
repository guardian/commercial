declare module '*.svg' {
	const content: string;
	export default content;
}

declare module '@guardian/prebid.js' {
	const pbjs: {
		processQueue: () => void;
	};
	// eslint-disable-next-line import/no-default-export -- allow prebid.js imports
	export default pbjs;
}

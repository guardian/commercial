declare module '*.svg' {
	const content: string;
	// eslint-disable-next-line import/no-default-export -- allow svg imports
	export default content;
}

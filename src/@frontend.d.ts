/* eslint-disable import/no-default-export -- it's appropriate, not a style thing */

declare module '*.svg' {
	const content: string;
	export default content;
}
declare module '*.html' {
	const content: string;
	export default content;
}

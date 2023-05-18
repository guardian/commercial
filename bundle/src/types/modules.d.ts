declare module '*.svg' {
	const content: string;
	// eslint-disable-next-line import/no-default-export -- allow svg imports
	export default content;
}

declare module 'ophan/ng' {
	const ophan: Ophan;
	// eslint-disable-next-line import/no-default-export -- that’s the ophan way
	export default ophan;
}

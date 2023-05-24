interface Ophan {
	setEventEmitter: unknown;
	trackComponentAttention: unknown;
	record: (...args: unknown[]) => void;
	viewId: unknown;
	pageViewId: string;
}

declare module '*.svg' {
	const content: string;
	// eslint-disable-next-line import/no-default-export -- allow svg imports
	export default content;
}

declare module 'ophan-tracker-js' {
	const ophan: Ophan;
	// eslint-disable-next-line import/no-default-export -- that’s the ophan way
	export default ophan;
}

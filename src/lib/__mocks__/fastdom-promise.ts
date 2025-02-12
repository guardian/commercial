/* eslint-disable @typescript-eslint/no-unused-vars -- It's a mock */
export default {
	measure: <T>(fn: () => T, ctx: unknown): Promise<T> =>
		Promise.resolve(fn()),
	mutate: <T>(fn: () => T, ctx: unknown): Promise<T> => Promise.resolve(fn()),
	clear: (id: unknown): void => {
		// Do nothing...
	},
};

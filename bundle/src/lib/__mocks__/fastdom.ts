/* eslint-disable @typescript-eslint/no-unused-vars -- It's a mock */
import promised from './fastdom-promise';

export default {
	measure: <T>(fn: () => T, _ctx: unknown): T => fn(),
	mutate: <T>(fn: () => T, _ctx: unknown): T => fn(),
	clear: (_id: unknown): void => {
		// Do nothing...
	},
	extend: (): typeof promised => promised,
};

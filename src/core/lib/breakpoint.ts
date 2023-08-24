/**
 * Breakpoints ordered from smallest to largest
 */
const breakpoints = ['mobile', 'phablet', 'tablet', 'desktop'] as const;

type Breakpoint = (typeof breakpoints)[number];

const isBreakpoint = (s: string): s is Breakpoint =>
	breakpoints.includes(s as Breakpoint);

export type { Breakpoint };
export { breakpoints, isBreakpoint };

type Breakpoint = 'mobile' | 'desktop' | 'phablet' | 'tablet';

const isBreakpoint = (s: string): s is Breakpoint =>
	s === 'mobile' || s === 'phablet' || s === 'tablet' || s === 'desktop';

export type { Breakpoint };
export { isBreakpoint };

import {
	type Breakpoint,
	breakpoints as BREAKPOINTS,
} from '@guardian/source/foundations';

type TestingBreakpoint = Extract<
	Breakpoint,
	'mobile' | 'tablet' | 'desktop' | 'wide'
>;

const HEIGHTS = {
	mobile: 600,
	tablet: 1024,
	desktop: 1100,
	wide: 1100,
} as const;

type BreakpointSize<T extends TestingBreakpoint> = {
	breakpoint: T;
	width: (typeof BREAKPOINTS)[T];
	height: (typeof HEIGHTS)[T];
};

const allBreakpoints = [
	'mobile',
	'tablet',
	'desktop',
	'wide',
] satisfies TestingBreakpoint[];

const getBreakpointSize = <T extends TestingBreakpoint>(
	breakpoint: T,
): BreakpointSize<T> => ({
	breakpoint,
	width: BREAKPOINTS[breakpoint],
	height: HEIGHTS[breakpoint],
});

const allBreakpointSizes = allBreakpoints.map(getBreakpointSize);

export {
	allBreakpointSizes,
	getBreakpointSize,
	type BreakpointSize,
	type TestingBreakpoint,
};

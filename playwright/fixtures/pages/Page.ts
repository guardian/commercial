import { type TestingBreakpoint } from '../breakpoints';

export type GuPage = {
	path: string;
	name?: string;
	expectedMinInlineSlots?: Record<Exclude<TestingBreakpoint, 'wide'>, number>;
	expectedSlotPositions?: Record<
		Exclude<TestingBreakpoint, 'wide'>,
		number[]
	>;
};

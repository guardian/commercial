export type GuPage = {
	path: string;
	name?: string;
	expectedMinInlineSlotsOnMobile?: number;
	expectedMinInlineSlotsOnDesktop?: number;
	expectedSlotPositionsOnMobile?: number[];
	expectedSlotPositionsOnDesktop?: number[];
};

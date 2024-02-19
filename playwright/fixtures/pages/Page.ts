export type GuPage = {
	path: string;
	name?: string;
	expectedMinInlineSlotsOnMobile?: number;
	expectedMinInlineSlotsOnDesktop?: number;
	expectedSlotIndicesOnMobile?: number[];
	expectedSlotIndicesOnDesktop?: number[];
};

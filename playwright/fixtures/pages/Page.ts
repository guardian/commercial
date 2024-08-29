export type GuPage = {
	path: string;
	name?: string;
	expectedMinInlineSlots?: {
		mobile: number;
		tablet: number;
		desktop: number;
	};
	expectedSlotPositions?: {
		mobile: number[];
		tablet: number[];
		desktop: number[];
	};
};

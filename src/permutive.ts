import { storage } from '@guardian/libs';

const PERMUTIVE_KEY = `_papns`;
const PERMUTIVE_PFP_KEY = `_pdfps`;

const getSegments = (key: string): string[] => {
	try {
		return (JSON.parse(storage.local.getRaw(key) ?? '[]') as string[])
			.slice(0, 250)
			.map((s) => Number.parseInt(s, 10))
			.filter((n) => typeof n === 'number' && !Number.isNaN(n))
			.map(String);
	} catch (e) {
		return [];
	}
};

export const getPermutiveSegments = (): string[] => getSegments(PERMUTIVE_KEY);
export const getPermutivePFPSegments = (): string[] =>
	getSegments(PERMUTIVE_PFP_KEY);

export const clearPermutiveSegments = (): void => {
	storage.local.remove(PERMUTIVE_KEY);
	storage.local.remove(PERMUTIVE_PFP_KEY);
};

export const _ = {
	PERMUTIVE_KEY,
	PERMUTIVE_PFP_KEY,
	getSegments,
};

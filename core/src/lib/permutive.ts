import { storage } from '@guardian/libs';

const PERMUTIVE_KEY = `_papns`;
const PERMUTIVE_PFP_KEY = `_pdfps`;

const getSegments = (key: string): string[] => {
	try {
		const rawSegments = storage.local.getRaw(key);
		const segments = rawSegments
			? (JSON.parse(rawSegments) as unknown)
			: null;

		if (!Array.isArray(segments)) return [];

		return segments
			.slice(0, 250)
			.map((s: string) => Number.parseInt(s, 10))
			.filter((n) => typeof n === 'number' && !Number.isNaN(n))
			.map(String);
	} catch (err) {
		return [];
	}
};

const getPermutiveSegments = (): string[] => getSegments(PERMUTIVE_KEY);
const getPermutivePFPSegments = (): string[] => getSegments(PERMUTIVE_PFP_KEY);

const clearPermutiveSegments = (): void => {
	storage.local.remove(PERMUTIVE_KEY);
	storage.local.remove(PERMUTIVE_PFP_KEY);
};

export const _ = {
	PERMUTIVE_KEY,
	PERMUTIVE_PFP_KEY,
	getSegments,
};

export {
	getPermutiveSegments,
	getPermutivePFPSegments,
	clearPermutiveSegments,
};

import { storage } from '@guardian/libs';
import {
	_,
	clearPermutiveSegments,
	getPermutivePFPSegments,
	getPermutiveSegments,
} from './permutive';

jest.mock('@guardian/libs', () => ({
	storage: {
		local: {
			getRaw: jest.fn(),
			remove: jest.fn(),
		},
	},
}));

afterEach(() => {
	jest.clearAllMocks();
});

describe('getSegments', () => {
	const DUMMY_KEY = `_dummyKey`;
	test('parses Permutive segments correctly', () => {
		(storage.local.getRaw as jest.Mock).mockReturnValue(['[42,84,63]']);
		expect(_.getSegments(DUMMY_KEY)).toEqual(['42', '84', '63']);
		(storage.local.getRaw as jest.Mock).mockReturnValue([]);
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
	});
	test('returns an empty array for bad inputs', () => {
		(storage.local.getRaw as jest.Mock).mockReturnValue('-1');
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
		(storage.local.getRaw as jest.Mock).mockReturnValue('bad-string');
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
		(storage.local.getRaw as jest.Mock).mockReturnValue('{}');
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
		(storage.local.getRaw as jest.Mock).mockReturnValue(
			'["not-a-number-segment"]',
		);
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
	});
	test('parses Permutive segments when local storage property is undefined', () => {
		(storage.local.getRaw as jest.Mock).mockReturnValue(undefined);
		expect(_.getSegments(DUMMY_KEY)).toEqual([]);
	});
});

describe('getPermutiveSegments', () => {
	test('calls the right key from localStorage', () => {
		getPermutiveSegments();
		// eslint-disable-next-line @typescript-eslint/unbound-method -- ok for jest
		expect(storage.local.getRaw as jest.Mock).toHaveBeenCalledWith(
			_.PERMUTIVE_KEY,
		);
	});
});

describe('getPermutivePFPSegments', () => {
	test('calls the right key from localStorage', () => {
		getPermutivePFPSegments();
		// eslint-disable-next-line @typescript-eslint/unbound-method -- ok for jest
		expect(storage.local.getRaw).toHaveBeenCalledWith(_.PERMUTIVE_PFP_KEY);
	});
});

describe('clearPermutiveSegments', () => {
	test('removes the right keys from localStorage', () => {
		clearPermutiveSegments();
		// eslint-disable-next-line @typescript-eslint/unbound-method -- ok for jest
		expect(storage.local.remove).toHaveBeenCalledWith(_.PERMUTIVE_KEY);
		// eslint-disable-next-line @typescript-eslint/unbound-method -- ok for jest
		expect(storage.local.remove).toHaveBeenCalledWith(_.PERMUTIVE_PFP_KEY);
	});
});

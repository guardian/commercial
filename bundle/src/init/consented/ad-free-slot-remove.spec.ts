import { isAdFree } from '../../lib/ad-free';
import { _ } from './ad-free-slot-remove';
import { removeSlots } from './remove-slots';

const { removeAdFreeSlots } = _;

jest.mock('lib/ad-free', () => ({
	isAdFree: jest.fn(),
}));

jest.mock('./remove-slots', () => ({
	removeSlots: jest.fn(() => Promise.resolve()),
}));

describe('adFreeSlotRemove', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should remove slots when user is ad-free', async () => {
		(isAdFree as jest.Mock).mockReturnValue(true);

		await removeAdFreeSlots();

		expect(removeSlots).toHaveBeenCalled();
	});

	it('should not remove slots when user is not ad-free', async () => {
		(isAdFree as jest.Mock).mockReturnValue(false);

		await removeAdFreeSlots();

		expect(removeSlots).not.toHaveBeenCalled();
	});
});

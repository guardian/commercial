import { isUserInVariant } from '../../experiments/ab';
import { recordAdmiralOphanEvent } from './admiral';

jest.mock('../../experiments/ab');

// Mock Ophan
window.guardian.ophan = {
	trackComponentAttention: jest.fn(),
	viewId: '',
	pageViewId: '',
	record: jest.fn(),
};

describe('Admiral functions', () => {
	describe('recordAdmiralOphanEvent', () => {
		it('calls ophan.record with expected params for action provided', () => {
			jest.mocked(isUserInVariant).mockReturnValue(true);

			recordAdmiralOphanEvent({ action: 'INSERT' });
			const expectedComponentEvent = {
				component: {
					componentType: 'AD_BLOCK_RECOVERY',
					id: 'admiral-adblock-recovery',
				},
				action: 'INSERT',
				abTest: {
					name: 'AdmiralAdblockRecovery',
					variant: 'variant-detect',
				},
			};
			expect(window.guardian.ophan?.record).toHaveBeenCalledWith({
				componentEvent: expectedComponentEvent,
			});
		});

		it('calls ophan.record with expected params for action and value provided', () => {
			jest.mocked(isUserInVariant).mockReturnValue(true);

			recordAdmiralOphanEvent({ action: 'DETECT', value: 'whitelisted' });
			const expectedComponentEvent = {
				component: {
					componentType: 'AD_BLOCK_RECOVERY',
					id: 'admiral-adblock-recovery',
				},
				action: 'DETECT',
				value: 'whitelisted',
				abTest: {
					name: 'AdmiralAdblockRecovery',
					variant: 'variant-detect',
				},
			};
			expect(window.guardian.ophan?.record).toHaveBeenCalledWith({
				componentEvent: expectedComponentEvent,
			});
		});

		it('omits the abTest key value pair if not in a variant', () => {
			jest.mocked(isUserInVariant).mockReturnValue(false);

			recordAdmiralOphanEvent({ action: 'DETECT', value: 'whitelisted' });
			const expectedComponentEvent = {
				component: {
					componentType: 'AD_BLOCK_RECOVERY',
					id: 'admiral-adblock-recovery',
				},
				action: 'DETECT',
				value: 'whitelisted',
			};
			expect(window.guardian.ophan?.record).toHaveBeenCalledWith({
				componentEvent: expectedComponentEvent,
			});
		});
	});
});

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
			recordAdmiralOphanEvent({ action: 'INSERT' });
			const expectedComponentEvent = {
				component: {
					componentType: 'AD_BLOCK_RECOVERY',
					id: 'admiral-adblock-recovery',
				},
				action: 'INSERT',
			};
			expect(window.guardian.ophan?.record).toHaveBeenCalledWith({
				componentEvent: expectedComponentEvent,
			});
		});

		it('calls ophan.record with expected params for action and value provided', () => {
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

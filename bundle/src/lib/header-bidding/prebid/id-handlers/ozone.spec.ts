import * as core from '@guardian/commercial-core';
import { getUserIdForOzone } from './ozone';

jest.mock('../../../../ab-testing');

describe('getUserIdForOzone', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('returns undefined when there is no email', async () => {
		const result = await getUserIdForOzone(null);

		expect(result).toBeUndefined();
	});

	it('returns a pubProvidedId config with the hashed email eid', async () => {
		jest.spyOn(core, 'hashEmailForClient').mockResolvedValueOnce(
			'hashed-email-value',
		);

		const result = await getUserIdForOzone('test@example.com');

		expect(core.hashEmailForClient).toHaveBeenCalledWith(
			'test@example.com',
			'ozone',
		);
		expect(result).toEqual({
			name: 'pubProvidedId',
			params: {
				eids: [
					{
						source: 'ozoneproject.com',
						uids: [
							{
								id: 'hashed-email-value',
								atype: 3,
								ext: {
									stype: 'ppuid',
								},
							},
						],
					},
				],
			},
		});
	});
});

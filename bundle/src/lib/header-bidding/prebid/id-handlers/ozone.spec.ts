import * as core from '@guardian/commercial-core';
import { isUserInTestGroup } from '../../../../ab-testing';
import { getUserIdForOzone } from './ozone';

jest.mock('../../../../ab-testing');

const mockIsUserInTestGroup = isUserInTestGroup as jest.MockedFunction<
	typeof isUserInTestGroup
>;

describe('getUserIdForOzone', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		window.guardian.config.switches.prebidOzoneId = true;
	});

	it('returns undefined when the user is not in the test variant group', async () => {
		mockIsUserInTestGroup.mockReturnValue(false);

		const result = await getUserIdForOzone('test@example.com');

		expect(result).toBeUndefined();
	});

	it('returns undefined when there is no email', async () => {
		mockIsUserInTestGroup.mockReturnValue(true);

		const result = await getUserIdForOzone(null);

		expect(result).toBeUndefined();
	});

	it('returns undefined when the feature switch is off', async () => {
		window.guardian.config.switches.prebidOzoneId = false;

		const result = await getUserIdForOzone(null);

		expect(result).toBeUndefined();
	});

	it('returns a pubProvidedId config with the hashed email eid when in the variant group', async () => {
		mockIsUserInTestGroup.mockReturnValue(true);
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

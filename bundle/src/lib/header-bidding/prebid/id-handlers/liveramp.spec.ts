import * as core from '@guardian/commercial-core';
import { loadScript } from '@guardian/libs';
import { isUserInTestGroup } from '../../../../experiments/beta-ab';
import { getUserIdForLiveRamp } from './liveramp';

jest.mock('@guardian/libs');
jest.mock('../../../../experiments/beta-ab');

const mockLoadScript = loadScript as jest.MockedFunction<typeof loadScript>;
const mockIsUserInTestGroup = isUserInTestGroup as jest.MockedFunction<
	typeof isUserInTestGroup
>;

describe('getUserIdForLiveRamp', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();

		// ensure user is always in test group for these tests
		// TODO: remove once the experiment is over
		mockIsUserInTestGroup.mockReturnValue(true);
	});

	afterEach(() => {
		window.removeEventListener('envelopeModuleReady', jest.fn());
	});

	describe('when user is in test group', () => {
		it('should return LiveRamp userId config when email is provided', async () => {
			const email = 'test@example.com';
			const result = await getUserIdForLiveRamp(email);

			expect(result).toEqual({
				name: 'identityLink',
				params: {
					pid: 14522,
					notUse3P: false,
				},
				storage: {
					type: 'cookie',
					name: 'idl_env',
					expires: 15,
					refreshInSeconds: 1800,
				},
			});
		});

		it('should preload the bundle script as a link element', async () => {
			// Spy on DOM manipulation
			const originalAppendChild = document.head.appendChild;
			const appendChildSpy = jest.spyOn(document.head, 'appendChild');

			// call the function
			const email = 'test@example.com';
			await getUserIdForLiveRamp(email);

			expect(appendChildSpy).toHaveBeenCalled();
			const linkElement = appendChildSpy.mock
				.calls[0]?.[0] as HTMLLinkElement;
			expect(linkElement.tagName).toBe('LINK');
			expect(linkElement.as).toBe('script');
			expect(linkElement.rel).toBe('preload');
			expect(linkElement.href).toBe(
				'https://launchpad.privacymanager.io/latest/launchpad.bundle.js',
			);

			// restore original appendChild
			document.head.appendChild = originalAppendChild;
		});

		it('should load the launchpad script with async and defer', async () => {
			const email = 'test@example.com';
			await getUserIdForLiveRamp(email);

			// can't test the script loading to the document.scripts object
			// but we can test that loadScript was called correctly
			expect(mockLoadScript).toHaveBeenCalledWith(
				'https://launchpad-wrapper.privacymanager.io/3a17d559-73d2-4f0d-aff1-54da33303144/launchpad-liveramp.js',
				{
					async: true,
					defer: true,
				},
			);
		});

		it('should handle script loading errors gracefully', async () => {
			const email = 'test@example.com';
			const error = new Error('Script load failed');
			mockLoadScript.mockRejectedValue(error);

			const result = await getUserIdForLiveRamp(email);
			expect(result).toEqual({
				name: 'identityLink',
				params: {
					pid: 14522,
					notUse3P: false,
				},
				storage: {
					type: 'cookie',
					name: 'idl_env',
					expires: 15,
					refreshInSeconds: 1800,
				},
			});
		});

		it('should handle email hashing errors gracefully', async () => {
			const email = 'test@example.com';
			const error = new Error('Hashing failed');
			jest.spyOn(core, 'hashEmailForClient').mockRejectedValueOnce(error);

			const result = await getUserIdForLiveRamp(email);
			expect(result).toEqual({
				name: 'identityLink',
				params: {
					pid: 14522,
					notUse3P: false,
				},
				storage: {
					type: 'cookie',
					name: 'idl_env',
					expires: 15,
					refreshInSeconds: 1800,
				},
			});
		});
	});

	describe('envelopeModuleReady event', () => {
		it('should set additional data when envelopeModuleReady event is fired after email is hashed', async () => {
			const email = 'test@example.com';
			const mockSetAdditionalData = jest.fn();
			window.atsenvelopemodule = {
				setAdditionalData: mockSetAdditionalData,
			};

			await getUserIdForLiveRamp(email);
			window.dispatchEvent(new Event('envelopeModuleReady'));

			expect(mockSetAdditionalData).toHaveBeenCalledWith({
				type: 'emailHashes',
				id: [
					'973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b',
				],
			});

			// clean up
			delete window.atsenvelopemodule;
		});

		it('should not set additional data when envelopeModuleReady event is fired before email is hashed', async () => {
			// best attempt to reset local unreachable variable `emailAsHash`.
			// ensure that the email hashing returns undefined to reset the emailAsHash variable
			jest.spyOn(core, 'hashEmailForClient').mockResolvedValueOnce(
				undefined as unknown as string,
			);
			const email = 'test@example.com';
			const mockSetAdditionalData = jest.fn();
			await getUserIdForLiveRamp(email);
			window.atsenvelopemodule = {
				setAdditionalData: mockSetAdditionalData,
			};

			// Dispatch the event before any getUserIdForLiveRamp call
			window.dispatchEvent(new Event('envelopeModuleReady'));
			expect(mockSetAdditionalData).not.toHaveBeenCalled();

			// clean up
			delete window.atsenvelopemodule;
		});

		it('should not throw error when envelopeModuleReady is fired but atsenvelopemodule is not available', async () => {
			// Ensure atsenvelopemodule is not defined
			delete window.atsenvelopemodule;
			const email = 'test@example.com';
			await getUserIdForLiveRamp(email);

			const event = new Event('envelopeModuleReady');
			expect(() => window.dispatchEvent(event)).not.toThrow();
		});
	});

	describe('when email is not present', () => {
		it('should return undefined', async () => {
			const result = await getUserIdForLiveRamp(null);

			expect(result).toBeUndefined();
			expect(mockLoadScript).not.toHaveBeenCalled();
		});
	});
});

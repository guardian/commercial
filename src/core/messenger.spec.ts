import {
	register as register_,
	_ as testExports,
	unregister as unregister_,
} from './messenger';
import { postMessage } from './messenger/post-message';

const onMessage = testExports.onMessage;
const register = register_;
const unregister = unregister_;

const noop = (): void => {
	// noop
};

window.addEventListener = jest.fn().mockImplementationOnce(noop);
window.removeEventListener = jest.fn().mockImplementationOnce(noop);

const mockOrigin = 'someorigin.com';

jest.mock('./messenger/post-message', () => ({
	postMessage: jest.fn(),
}));

describe('Cross-frame messenger', () => {
	const routines = {
		thrower(this: void) {
			throw new Error('catch this if you can!');
		},
		respond(this: void, value: unknown) {
			return `${value as string} johnny!` as unknown;
		},
		add1(this: void, value: unknown) {
			return ((value as number) + 1) as unknown;
		},
		add2(this: void, _: unknown, ret: unknown) {
			return ((ret as number) + 2) as unknown;
		},
		rubicon(this: void) {
			return 'rubicon' as unknown;
		},
	} as const;

	beforeEach(() => {
		jest.resetAllMocks();
		expect.hasAssertions();
	});

	it('should expose register and unregister as a public API', () => {
		expect(register).toBeDefined();
		expect(unregister).toBeDefined();
	});

	it('should register an event listener when there is at least one message routine', () => {
		register('click', noop);
		expect(window.addEventListener).toHaveBeenCalled();
		unregister('click', noop);
		expect(window.removeEventListener).toHaveBeenCalled();
	});

	it('should not respond when sending malformed JSON', (done) => {
		Promise.resolve()
			.then(() =>
				// @ts-expect-error -- we're stubbing the message event
				onMessage({ origin: mockOrigin, data: '{', source: '' }),
			)
			.then(() => {
				expect(postMessage).not.toHaveBeenCalled();
			})
			.then(done)
			.catch(done);
	});

	it('should not respond when sending incomplete payload', (done) => {
		const payloads = [
			{ type: 'missing data' },
			{ value: 'missing type' },
			{ type: 'unregistered', value: 'type' },
		];

		void Promise.all(
			payloads.map((data) => {
				return onMessage({
					origin: mockOrigin,
					data: JSON.stringify(data),
					// @ts-expect-error -- we're stubbing the message event
					source: '',
				});
			}),
		).then(() => {
			expect(postMessage).not.toHaveBeenCalled();
			done();
		});
	});

	it('should respond with a 405 code when no listener is attached to a message type', (done) => {
		const payload = {
			id: '01234567-89ab-cdef-fedc-ba9876543210',
			type: 'scroll',
			value: 'hello',
		};
		register('click', noop);
		register('scroll', noop);
		unregister('scroll', noop);
		void Promise.resolve()
			.then(() =>
				onMessage({
					origin: mockOrigin,
					data: JSON.stringify(payload),
					// @ts-expect-error -- we're stubbing the message event
					source: 'source',
				}),
			)
			.then(() => {
				expect(postMessage).toHaveBeenCalledWith(
					{
						error: {
							code: 405,
							message: 'Service scroll not implemented',
						},
						id: payload.id,
						result: null,
					},
					'source',
				);
			})
			.then(done)
			.catch(done)
			.then(() => {
				unregister('click', noop);
			});
	});

	it('should throw when the listener fails', (done) => {
		const payload = {
			id: '01234567-89ab-cdef-fedc-ba9876543210',
			type: 'click',
			value: 'hello',
		};
		register('click', routines.thrower);
		void Promise.resolve()
			.then(() =>
				onMessage({
					origin: mockOrigin,
					data: JSON.stringify(payload),
					// @ts-expect-error -- we're stubbing the message event
					source: 'source',
				}),
			)
			.then(() => {
				expect(postMessage).toHaveBeenCalledWith(
					{
						error: {
							code: 500,
							message:
								'Internal server error\n\nError: catch this if you can!',
						},
						id: payload.id,
						result: null,
					},
					'source',
				);
			})
			.then(done)
			.catch(done)
			.then(() => {
				unregister('click', routines.thrower);
			});
	});

	it("should respond with the routine's return value", (done) => {
		const payload = {
			id: '01234567-89ab-cdef-fedc-ba9876543210',
			type: 'click',
			value: 'hello',
		};
		register('click', routines.respond);
		void Promise.resolve()
			.then(() =>
				onMessage({
					origin: mockOrigin,
					data: JSON.stringify(payload),
					// @ts-expect-error -- we're stubbing the message event
					source: 'sauce',
				}),
			)
			.then(() => {
				expect(postMessage).toHaveBeenCalledWith(
					{
						error: null,
						id: payload.id,
						result: 'hello johnny!',
					},
					'sauce',
				);
			})
			.then(done)
			.catch(done)
			.then(() => {
				unregister('click', routines.respond);
			});
	});

	it('should respond with the listeners cumulative result', (done) => {
		const payload = {
			id: '01234567-89ab-cdef-fedc-ba9876543210',
			type: 'click',
			value: 1,
		};
		register('click', routines.add1);
		register('click', routines.add2);

		void Promise.resolve()
			.then(() =>
				onMessage({
					origin: mockOrigin,
					data: JSON.stringify(payload),
					// @ts-expect-error -- we're stubbing the message event
					source: 'sorcery',
				}),
			)
			.then(() => {
				expect(postMessage).toHaveBeenCalledWith(
					{
						error: null,
						id: payload.id,
						result: 4,
					},
					'sorcery',
				);
			})
			.then(done)
			.catch(done)
			.then(() => {
				unregister('click', routines.add1);
				unregister('click', routines.add2);
			});
	});

	it('should respond to Rubicon messages with no IDs', (done) => {
		const payload = {
			type: 'set-ad-height',
			value: { id: 'test', height: '20px' },
		};
		register('resize', routines.rubicon);
		void onMessage({
			origin: mockOrigin,
			data: JSON.stringify(payload),
			// @ts-expect-error -- we're stubbing the message event
			source: 'saucy',
		})
			.then(() => {
				console.log(postMessage);
				expect(postMessage).toHaveBeenCalledWith(
					{
						error: null,
						id: 'aaaa0000-bb11-cc22-dd33-eeeeee444444',
						result: 'rubicon',
					},
					'saucy',
				);
			})
			.then(done)
			.catch(done)
			.then(() => {
				unregister('resize', routines.rubicon);
			});
	});
});

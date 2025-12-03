import type { Advert } from '../define/Advert';
import { reportError } from '../lib/error/report-error';
import { onSlotRender } from './on-slot-render';

let advert: Partial<Advert>;

jest.useFakeTimers();

jest.mock('lib/error/report-error');

jest.mock('lib/dfp/get-advert-by-id', () => ({
	getAdvertById: jest.fn().mockImplementation(() => advert),
}));

jest.mock('./empty-advert');

jest.mock('./render-advert', () => ({
	renderAdvert: jest.fn().mockReturnValue(Promise.resolve(true)),
}));

const setAdvert = (adProps: Partial<Advert>) => {
	// create mock ad node and place within container element
	const node = document.createElement('div');
	node.id = 'adNodeId';

	const container = document.createElement('div');
	container.id = 'adContainerId';
	container.appendChild(node);

	advert = {
		id: 'dfp-ad--top-above-nav',
		finishedRendering: jest.fn(),
		node,
		...adProps,
	};
};

// render event data for non-empty slot
const onSlotRenderEvent = {
	creativeId: 123,
	creativeTemplateId: 456,
	isEmpty: false,
	lineItemId: 789,
	size: [300, 250],
	slot: {
		getSlotElementId: jest.fn().mockReturnValue('dfp-ad--top-above-nav'),
	},
} as unknown as googletag.events.SlotRenderEndedEvent;

beforeEach(() => {
	jest.clearAllMocks();
});

it('calls finishedRendering on the advert when rendered', async () => {
	const finishedRenderingSpy = jest.fn();
	setAdvert({
		finishedRendering: finishedRenderingSpy,
	});

	onSlotRender(onSlotRenderEvent);

	await jest.runAllTimersAsync();
	expect(finishedRenderingSpy).toHaveBeenCalledWith(true);
});

it('calls finishedRendering on the advert when not rendered', async () => {
	const finishedRenderingSpy = jest.fn();
	setAdvert({
		finishedRendering: finishedRenderingSpy,
	});

	onSlotRender({
		...onSlotRenderEvent,
		isEmpty: true,
	});

	await jest.runAllTimersAsync();
	expect(finishedRenderingSpy).toHaveBeenCalledWith(false);
});

describe('ad container overflows', () => {
	const mockElementDimensions = (
		element: Element,
		width: number,
		height: number,
	) => {
		Object.defineProperty(element, 'offsetHeight', {
			get: () => height,
		});
		Object.defineProperty(element, 'offsetWidth', {
			get: () => width,
		});
	};

	let node: HTMLElement;
	let container: HTMLElement;

	beforeEach(() => {
		// create mock ad node and place within container element
		node = document.createElement('div');
		node.id = 'dfp-ad--inline2';

		container = document.createElement('div');
		container.id = 'adContainerId';
		container.appendChild(node);

		setAdvert({
			node,
		});
	});

	it('does not report error if ad fits within container', async () => {
		mockElementDimensions(node, 100, 100);
		mockElementDimensions(container, 200, 200);
		onSlotRender(onSlotRenderEvent);

		await jest.runAllTimersAsync();
		expect(reportError).not.toHaveBeenCalled();
	});

	it('does not report error if ad is not an inline ad', async () => {
		node.id = 'not-inline-ad';
		mockElementDimensions(node, 200, 200);
		mockElementDimensions(container, 100, 100);
		onSlotRender(onSlotRenderEvent);

		await jest.runAllTimersAsync();
		expect(reportError).not.toHaveBeenCalled();
	});

	it('does not report error if ad id is first inline ad', async () => {
		node.id = 'dfp-ad--inline1';
		mockElementDimensions(node, 200, 200);
		mockElementDimensions(container, 100, 100);
		onSlotRender(onSlotRenderEvent);

		await jest.runAllTimersAsync();
		expect(reportError).not.toHaveBeenCalled();
	});

	it('reports error if ad element width is larger than parent element width', async () => {
		mockElementDimensions(node, 200, 100);
		mockElementDimensions(container, 100, 100);
		onSlotRender(onSlotRenderEvent);

		await jest.runAllTimersAsync();
		expect(reportError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Ad is overflowing its container',
			}),
			'commercial',
			{},
			{
				adId: 'dfp-ad--inline2',
				adSize: [300, 250],
				creativeId: 123,
				creativeTemplateId: 456,
				lineItemId: 789,
				adElementHeight: 100,
				adElementWidth: 200,
				adContainerHeight: 100,
				adContainerWidth: 100,
			},
		);
	});

	it('reports error if ad element height is larger than parent element height', async () => {
		mockElementDimensions(node, 100, 200);
		mockElementDimensions(container, 100, 100);
		onSlotRender(onSlotRenderEvent);

		await jest.runAllTimersAsync();
		expect(reportError).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Ad is overflowing its container',
			}),
			'commercial',
			{},
			{
				adId: 'dfp-ad--inline2',
				adSize: [300, 250],
				creativeId: 123,
				creativeTemplateId: 456,
				lineItemId: 789,
				adElementHeight: 200,
				adElementWidth: 100,
				adContainerHeight: 100,
				adContainerWidth: 100,
			},
		);
	});
});

import { commercialFeatures } from '../../lib/commercial-features';
import { init } from './article';
import { spaceFiller } from './space-filler';

jest.mock('lib/header-bidding/prebid/prebid', () => ({
	requestBids: jest.fn(),
}));

jest.mock('insert/fill-dynamic-advert-slot', () => ({
	fillDynamicAdSlot: jest.fn(),
}));

jest.mock('lib/commercial-features', () => ({
	commercialFeatures: {},
}));

jest.mock('insert/spacefinder/space-filler', () => ({
	spaceFiller: {
		fillSpace: jest.fn(),
	},
}));

jest.mock('experiments/ab', () => ({
	isUserInVariant: () => false,
}));

const spaceFillerStub = spaceFiller.fillSpace as jest.MockedFunction<
	typeof spaceFiller.fillSpace
>;

const mockViewport = (width: number, height: number): void => {
	Object.defineProperties(window, {
		innerWidth: {
			value: width,
		},
		innerHeight: {
			value: height,
		},
	});
};

describe('Article Body Adverts', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		commercialFeatures.articleBodyAdverts = true;
		// @ts-expect-error -- we need to TS space-filler’s queue
		spaceFillerStub.mockImplementation(() => Promise.resolve(2));
		mockViewport(0, 1300);
		expect.hasAssertions();
	});

	it('should exist', () => {
		expect(init).toBeDefined();
	});

	it('should exit if commercial feature disabled', () => {
		const fillAdSlot = jest.fn();
		commercialFeatures.articleBodyAdverts = false;
		return init(fillAdSlot).then(() => {
			expect(spaceFillerStub).not.toHaveBeenCalled();
		});
	});
});

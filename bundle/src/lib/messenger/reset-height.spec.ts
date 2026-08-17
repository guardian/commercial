import { _ } from './reset-height';

const { toggleResetHeight } = _;

describe('Cross-frame messenger: reset-height', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should add the reset-height class to the slot', () => {
		document.body.innerHTML = `
			<div class="ad-slot-container">
              <div id="slot01" class="js-ad-slot" style="width: 7px; height: 14px;" >
                <div id="container01">
                    <iframe id="iframe01" class="iframe" data-unit="ch"></iframe>
                </div>
              </div>
			</div>`;

		const fakeAdSlot = document.querySelector('.js-ad-slot') as HTMLElement;

		expect(fakeAdSlot).not.toBeUndefined();

		const fakeSpecs = true;

		toggleResetHeight(fakeSpecs, fakeAdSlot);

		expect(fakeAdSlot.classList.contains('ad-slot--reset-height')).toBe(
			true,
		);
	});

	it('should remove the reset-height class from the slot', () => {
		document.body.innerHTML = `
			<div class="ad-slot-container">
			  <div id="slot01" class="js-ad-slot ad-slot--reset-height" style="width: 7px; height: 14px;" >
				<div id="container01">
					<iframe id="iframe01" class="iframe" data-unit="ch"></iframe>
				</div>
			  </div>
			</div>`;

		const fakeAdSlot = document.querySelector('.js-ad-slot') as HTMLElement;

		expect(fakeAdSlot).not.toBeUndefined();

		const fakeSpecs = false;

		toggleResetHeight(fakeSpecs, fakeAdSlot);

		expect(fakeAdSlot.classList.contains('ad-slot--reset-height')).toBe(
			false,
		);
	});
});

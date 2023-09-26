import { _ } from './fullwidth';

const { fullwidth } = _;

describe('Cross-frame messenger: fullwidth', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('should add the fullwidth class to the slot container', () => {
		document.body.innerHTML = `
			<div class="ad-slot-container">
              <div id="slot01" class="js-ad-slot" style="width: 7px; height: 14px;" >
                <div id="container01">
                    <iframe id="iframe01" class="iframe" data-unit="ch"></iframe>
                </div>
              </div>
			</div>`;

		const fakeAdSlotContainer = document.querySelector(
			'.ad-slot-container',
		) as HTMLElement;

		expect(fakeAdSlotContainer).not.toBeUndefined();

		const fakeSpecs = {
			fullwidth: true,
		};

		fullwidth(fakeSpecs, fakeAdSlotContainer);

		expect(
			fakeAdSlotContainer.classList.contains(
				'ad-slot-container--fullwidth',
			),
		).toBe(true);
	});

	it('should remove the fullwidth class from the slot container', () => {
		document.body.innerHTML = `
			<div class="ad-slot-container ad-slot-container--fullwidth">
			  <div id="slot01" class="js-ad-slot" style="width: 7px; height: 14px;" >
				<div id="container01">
					<iframe id="iframe01" class="iframe" data-unit="ch"></iframe>
				</div>
			  </div>
			</div>`;

		const fakeAdSlotContainer = document.querySelector(
			'.ad-slot-container',
		) as HTMLElement;

		expect(fakeAdSlotContainer).not.toBeUndefined();

		const fakeSpecs = {
			fullwidth: false,
		};

		fullwidth(fakeSpecs, fakeAdSlotContainer);

		expect(
			fakeAdSlotContainer.classList.contains(
				'ad-slot-container--fullwidth',
			),
		).toBe(false);
	});
});

import fastdom from '../../lib/fastdom-promise';

/**
 * Get the widths of the interactive grid, the grid body and the viewport. We need these to determine how to position ads within interactives, for example whether we need to add an offset class to move the ad over to the right.
 */
const getInteractiveGridWidths = () =>
	fastdom.measure(() => {
		const contentGridElement = document.querySelector<HTMLElement>(
			'.content--interactive-grid',
		);
		const bodyElement = contentGridElement?.querySelector<HTMLElement>(
			'[data-gu-name="body"]',
		);

		const bodyWidth = bodyElement?.getBoundingClientRect().width;
		const viewportWidth = window.innerWidth;

		return { bodyWidth, viewportWidth };
	});

/**
 * Determine whether the grid body is the standard desktop width, if it is then right rail ads don't need the offset right class, if it's not then we need to add the offset right class to move the ad over to the right.
 */
const isBodyStandardDesktopWidth = (bodyWidth: number): boolean => {
	return bodyWidth === 620;
};

/**
 * Determine whether the grid body is the full width of the viewport. If the grid body is the full width of the viewport, then it's unlikely to have a right hand column, even if it does, it's probably using wacky styles that we can't easily work with, so we won't attempt to insert ads in this case.
 **/
const isBodyFullWidthOfViewport = (
	bodyWidth: number,
	viewportWidth: number,
): boolean => {
	return bodyWidth >= viewportWidth;
};

/**
 * Calculate the grid type of the interactive. We need to know the grid type to determine how to position right rail ads within interactives, for example whether we need to add an offset class to move the ad over to the right.
 */
const calculateInteractiveGridType = async (): Promise<
	'standard' | 'full-width' | 'unknown'
> => {
	const { bodyWidth, viewportWidth } = await getInteractiveGridWidths();

	if (bodyWidth && viewportWidth) {
		// If the grid body is  the full width of the viewport, then it's unlikely to have a right hand column, even if it does, it's probably using wacky styles that we can't easily work with, so we won't attempt to insert ads in this case.
		if (isBodyFullWidthOfViewport(bodyWidth, viewportWidth)) {
			return 'unknown';
		}

		const isStandardWidth = isBodyStandardDesktopWidth(bodyWidth);

		return isStandardWidth ? 'standard' : 'full-width';
	}
	return 'unknown';
};

export { calculateInteractiveGridType };

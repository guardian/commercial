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

		const contentGridWidth =
			contentGridElement?.getBoundingClientRect().width;
		const bodyWidth = bodyElement?.getBoundingClientRect().width;
		const viewportWidth = window.innerWidth;

		return { contentGridWidth, bodyWidth, viewportWidth };
	});

/**
 * Determine whether the grid body is the full width of the content grid. If the grid body is full width, then we need to insert the ad without the offset right class, otherwise the ad will be pushed too far into the right hand column and could end up outside of the viewport.
 */
const isBodyFullWidthOfGrid = (
	bodyWidth: number,
	contentGridWidth: number,
): boolean => {
	return bodyWidth >= contentGridWidth;
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
	const { bodyWidth, contentGridWidth, viewportWidth } =
		await getInteractiveGridWidths();

	if (bodyWidth && contentGridWidth && viewportWidth) {
		// If the grid body is  the full width of the viewport, then it's unlikely to have a right hand column, even if it does, it's probably using wacky styles that we can't easily work with, so we won't attempt to insert ads in this case.
		if (isBodyFullWidthOfViewport(bodyWidth, viewportWidth)) {
			return 'unknown';
		}

		const isFullWidth = isBodyFullWidthOfGrid(bodyWidth, contentGridWidth);

		return isFullWidth ? 'full-width' : 'standard';
	}
	return 'unknown';
};

export { calculateInteractiveGridType };

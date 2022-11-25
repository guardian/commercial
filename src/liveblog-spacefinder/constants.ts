/**
 * Maximum number of inline ads to display on the page.
 */
const MAX_ADS = 8;

/**
 * Minimum allowed space between the top of the liveblog container and the highest inline ad.
 */
const MIN_SPACE_BEFORE_FIRST_AD = 1_000;

/**
 * Minimum allowed space between inline ads in pixels.
 *
 * Cypress testing in commercial-tools repo will tell us whether this number is too small or too big.
 */
const MIN_SPACE_BETWEEN_ADS = 1_400;

export { MAX_ADS, MIN_SPACE_BEFORE_FIRST_AD, MIN_SPACE_BETWEEN_ADS };

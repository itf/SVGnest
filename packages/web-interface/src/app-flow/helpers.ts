import { BUTTON_ACTION } from '../types';

/**
 * Determines which buttons should be disabled or hidden based on application state.
 *
 * Analyzes the current application state to determine appropriate button states
 * for a consistent and intuitive user experience. Considers factors like:
 * - Whether nesting is currently in progress
 * - Whether a bin has been selected
 * - Whether SVG data is available
 * - Current iteration count
 *
 * @group AppFlow
 * @param isWorking - Whether the nesting algorithm is currently running
 * @param isBinSelected - Whether a bin element has been selected in the SVG
 * @param iterations - Number of completed nesting iterations
 * @param svgSrc - Current SVG source data
 * @returns Object containing arrays of disabled and hidden button actions
 */
export const getModifiedButtons = (
    isWorking: boolean,
    isBinSlected: boolean,
    iterations: number,
    svgSrc: string
): { disabledButtons: BUTTON_ACTION[]; hiddenButtons: BUTTON_ACTION[] } => {
    const disabledButtons: BUTTON_ACTION[] = [];
    const hiddenButtons: BUTTON_ACTION[] = [];

    if (isWorking) {
        hiddenButtons.push(BUTTON_ACTION.START);
        disabledButtons.push(BUTTON_ACTION.UPLOAD);
        disabledButtons.push(BUTTON_ACTION.SETTINGS);
    } else {
        hiddenButtons.push(BUTTON_ACTION.PAUSE);
    }

    if (!isBinSlected || !svgSrc) {
        disabledButtons.push(BUTTON_ACTION.START);
    }

    if (iterations === 0 || isWorking) {
        disabledButtons.push(BUTTON_ACTION.DOWNLOAD);
    }

    return { disabledButtons, hiddenButtons };
};

/**
 * Converts a decimal value to a percentage with ceiling rounding.
 *
 * Safely converts decimal numbers to percentage values, ensuring the result
 * never exceeds 100% and is rounded up to the nearest integer.
 *
 * @group AppFlow
 * @param value - Decimal value between 0 and 1
 * @returns Percentage value as integer (0-100)
 */
export const toPercents = (value: number): number => Math.min(Math.ceil(value * 100), 100);

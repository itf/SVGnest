import { memo } from 'react';
import { COLORS } from './types';

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16">
        <rect width="16" height="16" rx="4" fill={COLORS.PRIMARY} />
        <g transform="rotate(-45 6 11)" fill={COLORS.BACKGROUND}>
            <rect x="5" y="5" width="2" height="8" />
            <rect x="5" y="11" width="12" height="2" />
        </g>
    </svg>
);

/**
 * Check icon component.
 *
 * Displays a checkmark icon used throughout the application for indicating
 * completion, success states, and positive confirmations. Features:
 * - Clean, minimalist checkmark design
 * - Consistent sizing with other application icons
 * - Scalable SVG format for crisp display
 * - Semantic meaning for accessibility tools
 * - Used in checkboxes, success messages, and completion indicators
 *
 * @group Assets
 * @component
 */
export default memo(CheckIcon);

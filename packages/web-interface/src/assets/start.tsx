import { memo } from 'react';

import { COLORS } from './types';
import { ICON_SHARED_PROPS } from './constants';


const StartIcon = () => (
    <svg {...ICON_SHARED_PROPS}>
        <path d="m11 41v-34l32 17z" fill={COLORS.PRIMARY} />
    </svg>
);

/**
 * Start icon component.
 *
 * Displays a play/start icon used for initiating actions, beginning processes,
 * and indicating playable or actionable content. Features:
 * - Classic play button triangle design
 * - Consistent visual weight with other application icons
 * - Scalable vector graphics for all screen densities
 * - Semantic meaning for media controls and action buttons
 * - Used in play buttons, start actions, and process initiation
 *
 * @group Assets
 * @component
 */
export default memo(StartIcon);

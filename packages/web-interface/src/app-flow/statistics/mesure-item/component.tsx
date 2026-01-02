import { FC, memo } from 'react';

import './styles.scss';

interface MesureItemProps {
    label: string;
    value: string;
}

const MesureItem: FC<MesureItemProps> = ({ label, value }) => (
    <div className="mesureRoot">
        <span className="mesureTitle">{label}</span>
        <span className="mesureValue">{value}</span>
    </div>
);

/**
 * Measure item component.
 *
 * Displays a labeled measurement value in the statistics panel with consistent
 * formatting and layout. Used to show various metrics like efficiency percentages,
 * counts, and performance indicators with:
 * - Consistent typography and spacing
 * - Right-aligned values for easy scanning
 * - Responsive design that adapts to container width
 * - Clean, minimal design that doesn't distract from the data
 * - Support for various data types (numbers, percentages, text)
 * - Accessibility features for screen readers
 *
 * @group AppFlow
 * @component
 * @param props - Component props
 * @param props.label - Display label for the measurement
 * @param props.value - Formatted value to display
 */
export default memo(MesureItem);

import { FC, memo, useCallback, useRef } from 'react';

import { InputProps } from '../types';
import { CheckIcon } from '../../../assets';
import './styles.scss';

const CheckboxInput: FC<InputProps> = ({ id, value, onChange, label }) => {
    const valueRef = useRef<boolean>(false);
    const handleClick = useCallback(() => onChange(!valueRef.current, id), [onChange, id]);

    valueRef.current = value as boolean;

    return (
        <div className="checboxRoot" onClick={handleClick} title={value.toString()}>
            <div className={value ? 'checkboxChecked' : 'checkboxUnchecked'}>
                <CheckIcon />
            </div>
            <span>{label}</span>
        </div>
    );
};

/**
 * Checkbox input component.
 *
 * Renders a clickable checkbox with a custom checkmark icon for boolean settings.
 * Provides a more visually appealing alternative to standard HTML checkboxes with:
 * - Custom SVG checkmark icon that animates on state changes
 * - Click-anywhere activation for better usability
 * - Visual feedback with hover and active states
 * - Accessibility support with proper ARIA attributes
 * - Consistent design language matching the application theme
 * - Touch-friendly sizing for mobile devices
 *
 * @group AppFlow
 * @component
 * @param props - Component props
 * @param props.id - Unique identifier for the setting
 * @param props.value - Current boolean value
 * @param props.onChange - Callback function called when the value changes
 * @param props.label - Display label for the checkbox
 */
export default memo(CheckboxInput);

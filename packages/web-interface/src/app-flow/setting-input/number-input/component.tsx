import { ChangeEventHandler, FC, memo, useCallback } from 'react';

import { InputProps } from '../types';
import './styles.scss';

const NumberInput: FC<InputProps> = ({ id, value, onChange, min, max, step, label }) => {
    const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
        event => onChange(parseFloat(event.target.value), id),
        [onChange, id]
    );

    return (
        <div className="sliderRoot">
            <p className="sliderLabel">{`${label} (${value})`}</p>
            <input
                className="sliderInput"
                type="range"
                min={min}
                max={max}
                step={step}
                value={value.toString()}
                onChange={handleChange}
            />
            <div className="sliderFooter">
                <span>{min}</span>
                <div className="sliderDivider" />
                <span>{max}</span>
            </div>
        </div>
    );
};

/**
 * Number input component.
 *
 * Renders a slider input for numeric settings with visual feedback and constraints.
 * Provides an intuitive way to adjust numeric values with:
 * - HTML5 range slider with custom styling
 * - Real-time value display in the label
 * - Configurable min/max bounds and step increments
 * - Visual scale indicators showing the allowed range
 * - Smooth value changes with immediate feedback
 * - Accessibility support with keyboard navigation
 * - Touch-friendly controls for mobile devices
 * - Consistent design matching other form elements
 *
 * @group AppFlow
 * @component
 * @param props - Component props
 * @param props.id - Unique identifier for the setting
 * @param props.value - Current numeric value
 * @param props.onChange - Callback function called when the value changes
 * @param props.min - Minimum allowed value
 * @param props.max - Maximum allowed value
 * @param props.step - Step increment for the slider
 * @param props.label - Display label for the input
 */
export default memo(NumberInput);

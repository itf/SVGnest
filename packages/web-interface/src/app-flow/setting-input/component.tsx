import { FC, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { INPUT_TYPE } from '../types';
import { InputProps, SettingInputProps } from './types';
import { CheckboxInput } from './checkbox-input';
import { NumberInput } from './number-input';
import './styles.scss';

const TYPE_TO_COMPONENT = new Map<INPUT_TYPE, FC<InputProps>>([
    [INPUT_TYPE.BOOLEAN, CheckboxInput],
    [INPUT_TYPE.NUMBER, NumberInput]
]);


const SettingInput: FC<SettingInputProps> = ({ id, type, value, onChange, min, max, step }) => {
    const Component = useMemo(() => TYPE_TO_COMPONENT.get(type), [type]);
    const { t } = useTranslation();

    return (
        <div className="settingRoot">
            <Component
                id={id}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                label={t(`appFlow.settingsDrawer.item.${id}.title`)}
            />
            <span className="settingHelpText">{t(`appFlow.settingsDrawer.item.${id}.description`)}</span>
        </div>
    );
};

/**
 * Setting input component.
 *
 * A flexible input component that renders different input types (checkbox, number slider)
 * for application settings with consistent styling and behavior. Automatically selects
 * the appropriate input component based on the setting type and provides:
 * - Type-safe value handling
 * - Consistent visual design
 * - Accessibility features
 * - Internationalization support for labels and help text
 * - Validation and constraints for numeric inputs
 *
 * @group AppFlow
 * @component
 * @param {SettingInputProps} props - Component props
 * @param {SETTING_ID} props.id - Unique identifier for the setting
 * @param {INPUT_TYPE} props.type - Type of input to render (boolean or number)
 * @param {InputValue} props.value - Current value of the setting
 * @param {function} props.onChange - Callback function called when the value changes
 * @param {number} props.min - Minimum allowed value (for number inputs)
 * @param {number} props.max - Maximum allowed value (for number inputs)
 * @param {number} props.step - Step increment for number inputs
 */
export default memo(SettingInput);

import { FC, useCallback, memo, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonGroupProps } from './types';
import { BUTTON_ACTION } from '../../types';
import { BUTTON_CONFIG } from './constants';
import { useResize } from '../hooks';
import './styles.scss';

const ButtonGroup: FC<ButtonGroupProps> = ({
    buttonsConfig,
    onClick,
    disabledButtons = [],
    hiddenButtons = [],
    localePrefix
}) => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useResize();
    const handleClick = useCallback(
        (event: MouseEvent) => onClick((event.target as HTMLButtonElement).id as BUTTON_ACTION),
        []
    );

    let disabled: boolean = false;
    let labelKey: string = '';
    let label: string = '';
    let isShowLabel: boolean = false;
    let className: string = '';

    return (
        <div className="buttonGroup">
            {buttonsConfig.map(id => {
                if (hiddenButtons.includes(id)) {
                    return null;
                }

                labelKey = `${localePrefix}.${id}.label`;
                label = i18n.exists(labelKey) ? t(labelKey) : '';
                disabled = disabledButtons.includes(id);
                isShowLabel = !(isMobile || !label);
                className = isShowLabel ? 'button' : 'iconButton';
                const Icon = BUTTON_CONFIG.get(id);

                return (
                    <button key={id} id={id} className={className} disabled={disabled} onClick={handleClick} aria-label={id}>
                        <div className="buttonIcon">
                            <Icon />
                        </div>
                        {isShowLabel && <span>{label}</span>}
                    </button>
                );
            })}
        </div>
    );
};

/**
 * Button group component.
 *
 * Renders a collection of action buttons with consistent styling and behavior.
 * Adapts to different screen sizes and provides flexible configuration options:
 * - Dynamic button layout based on available space
 * - Support for disabled and hidden button states
 * - Internationalization support for button labels
 * - Touch-friendly design for mobile devices
 * - Keyboard navigation and accessibility features
 * - Consistent visual design with hover and active states
 * - Configurable button actions and icons
 *
 * @group Shared
 * @component
 * @param {ButtonGroupProps} props - Component props
 * @param {BUTTON_ACTION[]} props.buttonsConfig - Array of button action types to display
 * @param {function} props.onClick - Callback function called when a button is clicked
 * @param {string[]} props.disabledButtons - Array of button IDs that should be disabled
 * @param {string[]} props.hiddenButtons - Array of button IDs that should be hidden
 * @param {string} props.localePrefix - Translation key prefix for button labels
 */
export default memo(ButtonGroup);

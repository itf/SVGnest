import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonGroup, SharedDrawer } from '../shared';
import { DESKTOP_BUTTON_CONFIG, MESSAGE_ID_TO_ALERT_TYPE, SETTINGS_CONFIG } from './constants';
import { AppFlowProps, PREDEFINED_ID } from './types';
import { BUTTON_ACTION } from '../types';
import { SettingInput } from './setting-input';
import { Statistics } from './statistics';
import useAppFlow from './hooks';
import './styles.scss';

/**
 * Main application flow component.
 *
 * Provides the core SVG nesting interface with comprehensive controls for uploading,
 * processing, and downloading SVG files. Features include:
 * - File upload with drag-and-drop support
 * - Real-time nesting progress tracking with visual progress bars
 * - Interactive settings panel for algorithm configuration
 * - Live statistics display showing placement efficiency and performance metrics
 * - Bin selection and visualization
 * - Download functionality for processed SVG results
 * - Responsive design adapting to mobile and desktop layouts
 *
 * @group AppFlow
 * @component
 * @param {AppFlowProps} props - Component props
 * @param {function} props.onClose - Callback function called when the application should close
 * @param {boolean} props.isDemoMode - Whether the application is running in demo mode
 */
const AppFlow: FC<AppFlowProps> = ({ onClose, isDemoMode }) => {
    const {
        handleChangeSettings,
        handleClick,
        handleUploadSvg,
        zoomStyles,
        isDrawerOpen,
        isWorking,
        svgWrapper,
        fileLoader,
        settings,
        estimate,
        progress,
        nestingStatistics,
        iterations,
        disabledButtons,
        hiddenButtons,
        message,
        messageId
    } = useAppFlow(onClose, isDemoMode);

    const { t, i18n } = useTranslation();

    const messageKey: string = `appFlow.alert.${messageId}.message`;

    return (
        <>
            <div className="appRoot">
                <a id={PREDEFINED_ID.FILE_SAVER} className="hidden" />
                <input className="hidden" type="file" accept="image/svg+xml" ref={fileLoader} onChange={handleUploadSvg} />
                <div className="appSvgContent">
                    <div className="appSvgWrapper">
                        <div ref={svgWrapper} style={zoomStyles} id={PREDEFINED_ID.SVG_WRAPPER} className="svgContent" />
                    </div>
                </div>
                <div className={MESSAGE_ID_TO_ALERT_TYPE.get(messageId)}>
                    {i18n.exists(messageKey) ? t(messageKey) : message}
                </div>
                <div className="appMenu">
                    <Statistics
                        {...nestingStatistics}
                        isWorking={isWorking}
                        progress={progress}
                        estimate={estimate}
                        iterations={iterations}
                    />
                    <ButtonGroup
                        localePrefix="appFlow.buttons"
                        buttonsConfig={DESKTOP_BUTTON_CONFIG}
                        onClick={handleClick}
                        disabledButtons={disabledButtons}
                        hiddenButtons={hiddenButtons}
                    />
                </div>
            </div>
            <SharedDrawer
                onClose={handleClick}
                isOpen={isDrawerOpen}
                closeAction={BUTTON_ACTION.CLOSE_SETTINGS}
                title={t('appFlow.settingsDrawer.title')}
            >
                {SETTINGS_CONFIG.map(config => (
                    <SettingInput {...config} value={settings[config.id]} key={config.id} onChange={handleChangeSettings} />
                ))}
                <div className="drawerSpace" />
            </SharedDrawer>
        </>
    );
};

export default AppFlow;

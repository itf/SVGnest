import { useCallback, useState, useEffect, FC } from 'react';
import { useTranslation } from 'react-i18next';

import { SplashScreen } from './splash-screen';
import { AppFlow } from './app-flow';
import { FADE_STATUS } from './types';

/**
 * Main application component.
 *
 * Serves as the root component for the SVGnest web application. Manages the overall
 * application state including transitions between the splash screen and main application
 * flow. Handles demo mode initialization and smooth fade transitions between screens.
 * Provides the main entry point for the React application with internationalization support.
 *
 * @group AppFlow
 * @component
 */
const App: FC = () => {
    const [isApp, setApp] = useState(false);
    const [isDemoMode, setDemoMode] = useState(false);
    const [fadeState, setFadeState] = useState<FADE_STATUS>(FADE_STATUS.NONE);
    const { t } = useTranslation();

    const handleUpdateScreen = useCallback((nextDemoMode: boolean = false, nextApp: boolean = false) => {
        setFadeState(FADE_STATUS.FADING); // Start fading out

        setTimeout(() => {
            setDemoMode(nextDemoMode);
            setApp(nextApp);
            setFadeState(FADE_STATUS.FADED); // Start fading in
        }, 300); // Duration of fade-out animation
    }, []);

    const handleOpenApp = useCallback((nextDemoMode: boolean) => handleUpdateScreen(nextDemoMode, true), [handleUpdateScreen]);

    useEffect(() => {
        const metaElement = document.getElementById('metaDescription');
        document.title = t('root.title');

        metaElement.setAttribute('content', t('root.description'));
    }, [t]);

    return (
        <div className={`fadeContainer ${fadeState}`}>
            {isApp ? (
                <AppFlow onClose={handleUpdateScreen} isDemoMode={isDemoMode} />
            ) : (
                <SplashScreen onOpenApp={handleOpenApp} />
            )}
        </div>
    );
};

export default App;

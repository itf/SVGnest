import { useCallback, useState, useEffect, ReactNode, FC, memo } from 'react';

import { ANIMATION_CLASSES, ANIMATION_CONFIG, INITIAL_STATE } from './constants';
import { useResize } from '../hooks';
import './styles.scss';

interface SharedDrawerProps {
    isOpen: boolean;
    onClose(action: string): void;
    closeAction: string;
    title: string;
    children: ReactNode[];
}

/**
 * Shared drawer component.
 *
 * Provides a slide-in drawer interface for displaying content like
 * settings, help, or additional information. Supports both vertical
 * and horizontal orientations based on screen layout.
 *
 * @group Shared Components
 * @component
 */
const SharedDrawer: FC<SharedDrawerProps> = ({ isOpen, onClose, closeAction, children, title }) => {
    const { isLendscape } = useResize();
    const [{ visible, animating }, setState] = useState(INITIAL_STATE);

    const updateAnimation = useCallback((value: boolean, callback: () => void = null) => {
        const { key1, key2, duration } = ANIMATION_CONFIG.get(value);

        setState(prevState => ({ ...prevState, [key1]: value }));
        setTimeout(() => {
            setState(prevState => ({ ...prevState, [key2]: value }));
            callback && callback();
        }, duration);
    }, []);

    const handleClose = useCallback(() => onClose(closeAction), [onClose, closeAction]);

    const handleCloseDrawer = useCallback(() => updateAnimation(false, handleClose), [handleClose, updateAnimation]);

    useEffect(() => {
        updateAnimation(isOpen);
    }, [isOpen, updateAnimation]);

    const { fade, drawer } = ANIMATION_CLASSES.get(animating);

    return visible ? (
        <>
            <div className={`fade ${fade}`} onClick={handleCloseDrawer} />
            <div className={`${isLendscape ? 'drawerHorizontal' : 'drawerVertical'} ${drawer}`}>
                <p className="drawerTitle">{title}</p>
                {children}
            </div>
        </>
    ) : null;
};

export default memo(SharedDrawer);

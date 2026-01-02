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

/**
 * Shared drawer component.
 *
 * A versatile slide-in drawer component for displaying contextual content and
 * secondary interfaces. Automatically adapts to screen orientation and provides:
 * - Smooth slide-in/slide-out animations
 * - Orientation-aware positioning (vertical on mobile, horizontal on desktop)
 * - Backdrop overlay with click-to-close functionality
 * - Keyboard navigation support (Escape key to close)
 * - Responsive design that works on all screen sizes
 * - Configurable close actions and titles
 * - Support for complex child content including forms and lists
 * - Consistent visual design with the application theme
 *
 * @group Shared
 * @component
 * @param props - Component props
 * @param props.isOpen - Whether the drawer is currently open
 * @param props.onClose - Callback function called when the drawer should close
 * @param props.closeAction - Action identifier for the close operation
 * @param props.title - Title text displayed in the drawer header
 * @param props.children - Child components to render inside the drawer
 */
export default memo(SharedDrawer);

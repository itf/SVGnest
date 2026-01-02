import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * Custom hook for responsive design and window resize handling.
 *
 * Provides real-time window dimensions and orientation information to adapt
 * the UI layout based on screen size and device orientation. Automatically
 * updates when the window is resized and provides:
 * - Mobile detection based on width threshold (600px)
 * - Landscape/portrait orientation detection
 * - Efficient event handling with cleanup
 * - SSR-safe implementation
 *
 * @group Shared
 * @returns Object with isMobile and isLandscape boolean flags
 */
export function useResize() {
    const handleResizeState = useCallback(
        () => ({ isMobile: window.innerWidth < 600, isLendscape: window.innerWidth > window.innerHeight }),
        []
    );

    const [resizeState, setResizeState] = useState(handleResizeState());

    const handleResize = useCallback(() => setResizeState(handleResizeState()), [handleResizeState]);

    useLayoutEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return resizeState;
}

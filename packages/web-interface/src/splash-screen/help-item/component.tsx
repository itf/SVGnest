import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import './styles.scss';

interface HelpItemProps {
    id: string;
    url: string;
    mask: string;
    t(key: string): string;
}

/**
 * Help item component.
 *
 * Displays individual help content items with structured information including
 * titles, descriptions, and optional external links. Provides a consistent
 * format for presenting help documentation with:
 * - Clear hierarchical information structure
 * - Optional clickable links to external resources
 * - Internationalization support for all text content
 * - Consistent spacing and typography
 * - Responsive design for different screen sizes
 * - Accessibility features for keyboard navigation
 * - Visual separation between different help topics
 *
 * @group SplashScreen
 * @component
 * @param props - Component props
 * @param props.id - Unique identifier for the help item
 * @param props.url - Optional URL for external link
 * @param props.mask - Display text for the link
 * @param props.t - Translation function for internationalization
 */
const HelpItem: FC<HelpItemProps> = ({ id, url, mask, t }) => (
    <div className="helpItemRoot">
        <p className="helpItemTitle">{t(`splashScreen.helpDrawer.item.${id}.title`)}</p>
        <p className="helpItemText">
            {t(`splashScreen.helpDrawer.item.${id}.description`)}
            {url && (
                <a href={url} className="helperItemLink" target="_blank">
                    {mask}
                </a>
            )}
        </p>
    </div>
);

export default HelpItem;

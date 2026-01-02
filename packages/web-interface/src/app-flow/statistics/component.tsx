import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { millisecondsToStr } from './helpers';
import { MesureItem } from './mesure-item';
import { toPercents } from '../helpers';
import { StatisticsProps } from './types';
import './styles.scss';

/**
 * Statistics component.
 *
 * Displays comprehensive real-time statistics and performance metrics during the SVG
 * nesting process. Provides visual feedback about the algorithm's progress and efficiency
 * including:
 * - Circular progress indicator showing completion percentage
 * - Estimated time remaining calculation
 * - Current iteration count and algorithm progress
 * - Parts placement statistics (placed vs total)
 * - Packing efficiency percentage
 * - Performance metrics formatted for readability
 * - Responsive layout adapting to available space
 *
 * @group AppFlow
 * @component
 * @param {StatisticsProps} props - Component props
 * @param {number} props.progress - Current progress percentage (0-100)
 * @param {number} props.estimate - Estimated time remaining in milliseconds
 * @param {number} props.iterations - Number of iterations completed
 * @param {number} props.placed - Number of parts successfully placed
 * @param {number} props.total - Total number of parts to place
 * @param {number} props.efficiency - Packing efficiency percentage
 * @param {boolean} props.isWorking - Whether the nesting process is currently running
 */
const Statistics: FC<StatisticsProps> = ({ progress, estimate, iterations, placed, total, efficiency, isWorking }) => {
    const { t } = useTranslation();

    return (
        <div className="statisticsRoot">
            {(isWorking || !!progress) && (
                <div className="statisticsProgresItem">
                    <div
                        className="statisticsProgressBar"
                        style={{
                            background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#3bb34a ${progress}%, white 0)`
                        }}
                    >
                        <div className="statisticsProgressDescription">{`${progress}%`}</div>
                    </div>
                    <div className="statisticsProgressContent">
                        <div className="statisticsProgressDescription">{t('appFlow.statistics.progress.title')}</div>
                        <div className="statisticsProgressDescription">
                            {t('appFlow.statistics.progress.subtitle', { time: millisecondsToStr(estimate, t) })}
                        </div>
                    </div>
                </div>
            )}
            <div className="statisticsMesures">
                {!!iterations && (
                    <MesureItem label={t('appFlow.statistics.meure.iterations.label')} value={iterations.toString()} />
                )}
                {!!total && <MesureItem label={t('appFlow.statistics.meure.places.label')} value={`${placed}/${total}`} />}
                {!!efficiency && (
                    <MesureItem label={t('appFlow.statistics.meure.efficiency.label')} value={`${toPercents(efficiency)}%`} />
                )}
            </div>
        </div>
    );
};

export default Statistics;

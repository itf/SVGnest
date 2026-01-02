import { TFunction } from 'i18next';

import { TIME_ITEMS } from './constants';
import { TIME_KEY, TimeItem } from './types';

/**
 * Converts milliseconds to a human-readable time string with appropriate units.
 *
 * Formats time duration in milliseconds into localized strings using the most
 * appropriate time unit (years, days, hours, minutes). Automatically selects
 * the largest applicable unit and provides singular/plural forms through
 * internationalization.
 *
 * @group AppFlow
 * @param milliseconds - Time duration in milliseconds
 * @param t - Translation function for internationalization
 * @returns Localized time string (e.g., "2 hours", "30 minutes")
 */
export function millisecondsToStr(milliseconds: number, t: TFunction): string {
    const seconds = Math.floor(milliseconds / 1000);
    const itemCount = TIME_ITEMS.length;
    let item: TimeItem = null;
    let count: number = 0;
    let i: number = 0;
    let timeKey: TIME_KEY = TIME_KEY.MILISECOND;

    for (i = 0; i < itemCount; ++i) {
        item = TIME_ITEMS[i];
        count = Math.floor(seconds / item.seconds);

        if (count !== 0) {
            timeKey = item.key;
            break;
        }
    }

    return t(`appFlow.statistics.progress.counter.${timeKey}`, { count });
}

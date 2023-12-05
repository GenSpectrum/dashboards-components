import { LapisFilter, NamedLapisFilter, TemporalGranularity } from '../types';
import { FetchAggregatedOperator } from '../operator/FetchAggregatedOperator';
import { MapOperator } from '../operator/MapOperator';
import { GroupByAndSumOperator } from '../operator/GroupByAndSumOperator';
import { FillMissingOperator } from '../operator/FillMissingOperator';
import { getMinMaxString } from '../utils';
import { generateAllInRange } from '../temporal-utils';
import { SortOperator } from '../operator/SortOperator';
import { Operator } from '../operator/Operator';
import { SlidingOperator } from '../operator/SlidingOperator';
import { DivisionOperator } from '../operator/DivisionOperator';

export function queryPrevalenceOverTime(
    numerator: NamedLapisFilter | NamedLapisFilter[],
    denominator: NamedLapisFilter,
    granularity: TemporalGranularity,
    smoothingWindow: number,
    lapis: string,
    signal?: AbortSignal,
) {
    const numerators = [];
    if (Array.isArray(numerator)) {
        numerators.push(...numerator);
    } else {
        numerators.push(numerator);
    }

    const denominatorData = fetchAndPrepare(denominator, granularity, smoothingWindow);
    const subQueries = numerators.map(async (n) => {
        const numeratorData = fetchAndPrepare(n, granularity, smoothingWindow);
        const divide = new DivisionOperator(numeratorData, denominatorData, 'dateRange', 'count', 'prevalence');
        const d = await divide.evaluate(lapis, signal);
        return {
            displayName: n.displayName,
            content: d.content,
        };
    });
    return Promise.all(subQueries);
}

function fetchAndPrepare(filter: LapisFilter, granularity: TemporalGranularity, smoothingWindow: number) {
    const fetchData = new FetchAggregatedOperator<{
        date: string | null;
    }>(filter, ['date']);
    const mapData = new MapOperator(fetchData, (d) => mapDateToGranularityRange(d, granularity));
    const groupByData = new GroupByAndSumOperator(mapData, 'dateRange', 'count');
    const fillData = new FillMissingOperator(
        groupByData,
        'dateRange',
        getMinMaxString,
        (min, max) => generateAllInRange(min, max, granularity),
        (key) => ({ dateRange: key, count: 0 }),
    );
    const sortData = new SortOperator(fillData, dateRangeCompare);
    let smoothData: Operator<{ dateRange: string | null; count: number }> = sortData;
    if (smoothingWindow >= 1) {
        smoothData = new SlidingOperator(sortData, smoothingWindow, averageSmoothing);
    }
    return smoothData;
}

function mapDateToGranularityRange(d: { date: string | null; count: number }, granularity: TemporalGranularity) {
    let dateRange: string | null = null;
    if (d.date !== null) {
        switch (granularity) {
            case 'day':
                dateRange = d.date;
                break;
            case 'month':
                dateRange = `${new Date(d.date).getFullYear()}-${(new Date(d.date).getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}`;
                break;
            case 'year':
                dateRange = new Date(d.date).getFullYear().toString();
                break;
        }
    }
    return {
        dateRange,
        count: d.count,
    };
}

function dateRangeCompare(a: { dateRange: string | null }, b: { dateRange: string | null }) {
    if (a.dateRange === null) {
        return 1;
    }
    if (b.dateRange === null) {
        return -1;
    }
    return a.dateRange.localeCompare(b.dateRange);
}

function averageSmoothing(slidingWindow: { dateRange: string | null; count: number }[]) {
    const average = slidingWindow.reduce((acc, curr) => acc + curr.count, 0) / slidingWindow.length;
    const centerIndex = Math.floor(slidingWindow.length / 2);
    return { dateRange: slidingWindow[centerIndex].dateRange, count: average };
}

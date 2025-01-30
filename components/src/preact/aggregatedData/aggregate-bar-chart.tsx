import { BarController, Chart, type ChartConfiguration, type ChartDataset, registerables } from 'chart.js';
import { type FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';

import type { AggregateData } from '../../query/queryAggregateData';
import GsChart from '../components/chart';
import { UserFacingError } from '../components/error-display';
import { NoDataDisplay } from '../components/no-data-display';
import { singleGraphColorRGBAById } from '../shared/charts/colors';
import { formatProportion } from '../shared/table/formatProportion';

interface AggregateBarChartProps {
    data: AggregateData;
    fields: string[];
    maxNumberOfBars: number;
    maintainAspectRatio: boolean;
}

Chart.register(...registerables, BarController);

type DataPoint = {
    y: string;
    x: number;
    proportion: number;
};

export const AggregateBarChart: FunctionComponent<AggregateBarChartProps> = ({
    data,
    fields,
    maxNumberOfBars,
    maintainAspectRatio,
}) => {
    if (data.length === 0) {
        return <NoDataDisplay />;
    }

    if (fields.length === 0) {
        throw new UserFacingError(
            'No fields given',
            'Cannot display a bar chart when the "fields" attribute of this component is empty, i.e. there are no fields given that the data should be stratified by. This must be fixed by the administrator of this page.',
        );
    }

    if (fields.length > 2) {
        throw new UserFacingError(
            'Too many fields given',
            `Cannot display a bar chart when the "fields" attribute of this component contains more than two values. Got the fields: ${fields.join(', ')}. This must be fixed by the administrator of this page.`,
        );
    }

    return (
        <AggregateBarChartInner
            data={data}
            fields={fields}
            maxNumberOfBars={maxNumberOfBars}
            maintainAspectRatio={maintainAspectRatio}
        />
    );
};

const AggregateBarChartInner: FunctionComponent<AggregateBarChartProps> = ({
    data,
    fields,
    maxNumberOfBars,
    maintainAspectRatio,
}) => {
    const config = useMemo((): ChartConfiguration<'bar', DataPoint[]> => {
        const { datasets, countsOfEachBar } = getDatasets(fields, maxNumberOfBars, data);

        return {
            type: 'bar',
            data: {
                datasets,
            },
            options: {
                maintainAspectRatio,
                animation: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            autoSkip: false,
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'y',
                        callbacks: {
                            afterTitle:
                                countsOfEachBar === undefined
                                    ? undefined
                                    : (tooltipItems) => {
                                          return `Total: ${countsOfEachBar.get(tooltipItems[0].label)}`;
                                      },
                            label: (context) => {
                                const { x, proportion } = context.dataset.data[
                                    context.dataIndex
                                ] as unknown as DataPoint;
                                return fields.length === 1
                                    ? `${x} (${formatProportion(proportion)})`
                                    : `${context.dataset.label}: ${x} (${formatProportion(proportion)})`;
                            },
                        },
                    },
                },
            },
        };
    }, [data, fields, maintainAspectRatio, maxNumberOfBars]);

    return <GsChart configuration={config} />;
};

function getDatasets(
    fields: string[],
    maxNumberOfBars: number,
    data: (Record<string, string | number | boolean | null> & {
        count: number;
        proportion: number;
    })[],
) {
    const sortedData = data.sort((a, b) => b.count - a.count);

    if (fields.length === 1) {
        return {
            datasets: [
                {
                    borderWidth: 1,
                    backgroundColor: singleGraphColorRGBAById(0, 0.3),
                    borderColor: singleGraphColorRGBAById(0),
                    data: sortedData.slice(0, maxNumberOfBars).map((row) => ({
                        y: row[fields[0]] as string,
                        x: row.count,
                        proportion: row.proportion,
                    })),
                },
            ],
        };
    }

    const map = new Map<string, DataPoint[]>();
    const countsOfEachBar = new Map<string, number>();

    for (const row of sortedData) {
        const yValue = row[fields[0]];
        const secondaryValue = row[fields[1]];
        if (yValue === null || secondaryValue === null) {
            continue;
        }
        const yAxisKey = String(yValue);
        const secondaryKey = String(secondaryValue);

        if (!map.has(secondaryKey)) {
            map.set(secondaryKey, []);
        }
        map.get(secondaryKey)?.push({
            y: yAxisKey,
            x: row.count,
            proportion: row.proportion,
        });
        countsOfEachBar.set(yAxisKey, (countsOfEachBar.get(yAxisKey) ?? 0) + row.count);
    }

    const datasets: ChartDataset<'bar', DataPoint[]>[] = Array.from(map.entries())
        .map(sortAndTruncateYAxisKeys(countsOfEachBar, maxNumberOfBars))
        .map(([key, value], index) => ({
            borderWidth: 1,
            backgroundColor: singleGraphColorRGBAById(index, 0.3),
            borderColor: singleGraphColorRGBAById(index),
            label: key,
            data: value,
        }));
    return { datasets, countsOfEachBar };
}

function sortAndTruncateYAxisKeys(countsOfEachBar: Map<string, number>, maxNumberOfBars: number) {
    const yAxisKeysToConsider = new Set(
        Array.from(countsOfEachBar.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxNumberOfBars)
            .map(([key]) => key),
    );

    return ([key, value]: [string, DataPoint[]]): [string, DataPoint[]] => {
        const sortedValues = value.sort((a, b) => (countsOfEachBar.get(b.y) ?? 0) - (countsOfEachBar.get(a.y) ?? 0));
        const valuesWithLargestBars = sortedValues
            .slice(0, maxNumberOfBars)
            .filter((v) => yAxisKeysToConsider.has(v.y));
        return [key, valuesWithLargestBars];
    };
}

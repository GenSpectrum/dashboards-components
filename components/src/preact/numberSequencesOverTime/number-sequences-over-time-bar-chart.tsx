import { Chart, type ChartConfiguration, type ChartDataset, registerables } from 'chart.js';
import { useMemo } from 'preact/hooks';

import { getNumberOfSequencesOverTimeTableData } from './getNumberOfSequencesOverTimeTableData';
import { type NumberOfSequencesDatasets } from '../../query/queryNumberOfSequencesOverTime';
import GsChart from '../components/chart';
import { singleGraphColorRGBAById } from '../shared/charts/colors';
import { getYAxisScale, type ScaleType } from '../shared/charts/getYAxisScale';

interface NumberSequencesOverBarChartProps {
    data: NumberOfSequencesDatasets;
    yAxisScaleType: ScaleType;
    maintainAspectRatio: boolean;
}

Chart.register(...registerables);

export const NumberSequencesOverTimeBarChart = ({
    data,
    yAxisScaleType,
    maintainAspectRatio,
}: NumberSequencesOverBarChartProps) => {
    const config: ChartConfiguration = useMemo(
        () => ({
            type: 'bar',
            data: {
                datasets: getDatasets(data),
            },
            options: {
                maintainAspectRatio,
                animation: false,
                scales: {
                    y: {
                        type: getYAxisScale(yAxisScaleType).type,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                },
            },
        }),
        [data, yAxisScaleType],
    );

    return <GsChart configuration={config} />;
};

const getDatasets = (data: NumberOfSequencesDatasets) => {
    const tableData = getNumberOfSequencesOverTimeTableData(data, 'date');

    return data.map(
        ({ displayName }, index) =>
            ({
                borderWidth: 1,
                label: displayName,
                backgroundColor: singleGraphColorRGBAById(index, 0.3),
                borderColor: singleGraphColorRGBAById(index),
                data: tableData.map((row) => ({
                    x: row.date,
                    y: row[displayName],
                })),
            }) as ChartDataset<'bar', { x: string; y: number }[]>,
    );
};

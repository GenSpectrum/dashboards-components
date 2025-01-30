import { Chart, type ChartConfiguration, registerables, type TooltipItem } from 'chart.js';

import { type YearMonthDayClass } from '../../utils/temporalClass';
import GsChart from '../components/chart';
import { LogitScale } from '../shared/charts/LogitScale';
import { singleGraphColorRGBByName } from '../shared/charts/colors';
import { confidenceIntervalDataLabel } from '../shared/charts/confideceInterval';
import { getYAxisMax, type YAxisMaxConfig } from '../shared/charts/getYAxisMax';
import { getYAxisScale, type ScaleType } from '../shared/charts/getYAxisScale';
import { formatProportion } from '../shared/table/formatProportion';

interface RelativeGrowthAdvantageChartData {
    t: YearMonthDayClass[];
    proportion: number[];
    ciLower: number[];
    ciUpper: number[];
    observed: number[];
    params: {
        fd: {
            value: number;
            ciLower: number;
            ciUpper: number;
        };
    };
}

interface RelativeGrowthAdvantageChartProps {
    data: RelativeGrowthAdvantageChartData;
    yAxisScaleType: ScaleType;
    yAxisMaxConfig: YAxisMaxConfig;
    maintainAspectRatio: boolean;
}

Chart.register(...registerables, LogitScale);

const RelativeGrowthAdvantageChart = ({
    data,
    yAxisScaleType,
    yAxisMaxConfig,
    maintainAspectRatio,
}: RelativeGrowthAdvantageChartProps) => {
    const maxY =
        yAxisScaleType !== 'logit'
            ? getYAxisMax(Math.max(...data.proportion), yAxisMaxConfig?.[yAxisScaleType])
            : undefined;

    const config: ChartConfiguration = {
        type: 'line',
        data: {
            labels: data.t,
            datasets: datasets(data),
        },
        options: {
            maintainAspectRatio,
            animation: false,
            scales: {
                y: { ...getYAxisScale(yAxisScaleType), max: maxY },
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: tooltip(),
            },
        },
    };

    return (
        <div className='flex h-full flex-col'>
            <RelativeGrowthAdvantageDisplay
                relativeAdvantage={data.params.fd.value}
                relativeAdvantageLowerBound={data.params.fd.ciLower}
                relativeAdvantageUpperBound={data.params.fd.ciUpper}
            />
            <div className='flex-1'>
                <GsChart configuration={config} />
            </div>
        </div>
    );
};

const RelativeGrowthAdvantageDisplay = ({
    relativeAdvantage,
    relativeAdvantageLowerBound,
    relativeAdvantageUpperBound,
}: {
    relativeAdvantage: number;
    relativeAdvantageLowerBound: number;
    relativeAdvantageUpperBound: number;
}) => {
    return (
        <div class='mx-auto flex items-end flex-wrap'>
            <span class='text-[#606060]'>Relative advantage:</span>
            <div>
                <span class='text-2xl ml-3'> {formatProportion(relativeAdvantage)} </span>
                <span class='ml-2.5'>
                    ({formatProportion(relativeAdvantageLowerBound)} - {formatProportion(relativeAdvantageUpperBound)})
                </span>
            </div>
        </div>
    );
};

const datasets = (data: RelativeGrowthAdvantageChartData) => {
    return [
        {
            type: 'line' as const,
            label: 'Prevalence',
            data: data.proportion,
            borderWidth: 1,
            pointRadius: 0,
            borderColor: singleGraphColorRGBByName('indigo'),
            backgroundColor: singleGraphColorRGBByName('indigo'),
        },
        {
            type: 'line' as const,
            label: 'CI Lower',
            data: data.ciLower,
            borderWidth: 1,
            pointRadius: 0,
            fill: '+1',
            backgroundColor: singleGraphColorRGBByName('indigo', 0.3),
        },
        {
            type: 'line' as const,
            label: 'CI Upper',
            data: data.ciUpper,
            borderWidth: 1,
            pointRadius: 0,
            fill: '-1',
            backgroundColor: singleGraphColorRGBByName('indigo', 0.3),
        },
        {
            type: 'scatter' as const,
            label: 'Observed',
            data: data.observed,
            pointBackgroundColor: singleGraphColorRGBByName('green'),
            pointRadius: 2,
        },
    ];
};

const tooltip = () => {
    return {
        mode: 'index' as const,
        intersect: false,
        filter: ({ datasetIndex }: TooltipItem<'line'>) => {
            return datasetIndex !== 1 && datasetIndex !== 2;
        },
        callbacks: {
            label: (context: TooltipItem<'line'>) => {
                switch (context.datasetIndex) {
                    case 0: {
                        const value = context.dataset.data[context.dataIndex];
                        const ciLower = context.dataset.data[context.dataIndex + 1];
                        const ciUpper = context.dataset.data[context.dataIndex + 2];
                        if (typeof value !== 'number' || typeof ciLower !== 'number' || typeof ciUpper !== 'number') {
                            return '';
                        }
                        return confidenceIntervalDataLabel(value, ciLower, ciUpper, context.dataset.label);
                    }

                    case 3: {
                        const value = context.dataset.data[context.dataIndex];
                        if (typeof value !== 'number') {
                            return '';
                        }
                        return `Observed: ${value.toFixed(3)}`;
                    }
                    default:
                        return '';
                }
            },
        },
    };
};

export default RelativeGrowthAdvantageChart;

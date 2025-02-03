import { Chart, type ChartConfiguration, type ChartDataset, registerables, type TooltipItem } from 'chart.js';
import { BarWithErrorBar, BarWithErrorBarsController } from 'chartjs-chart-error-bars';
import { useMemo } from 'preact/hooks';

import { maxInData } from './prevalence-over-time';
import {
    type PrevalenceOverTimeData,
    type PrevalenceOverTimeVariantData,
    type PrevalenceOverTimeVariantDataPoint,
} from '../../query/queryPrevalenceOverTime';
import { sortNullToBeginningThenByDate } from '../../utils/sort';
import GsChart from '../components/chart';
import { NoDataDisplay } from '../components/no-data-display';
import { LogitScale } from '../shared/charts/LogitScale';
import { singleGraphColorRGBAById } from '../shared/charts/colors';
import { type ConfidenceIntervalMethod, wilson95PercentConfidenceInterval } from '../shared/charts/confideceInterval';
import { getYAxisMax, type YAxisMaxConfig } from '../shared/charts/getYAxisMax';
import { getYAxisScale, type ScaleType } from '../shared/charts/getYAxisScale';

interface PrevalenceOverTimeBarChartProps {
    data: PrevalenceOverTimeData;
    yAxisScaleType: ScaleType;
    confidenceIntervalMethod: ConfidenceIntervalMethod;
    yAxisMaxConfig: YAxisMaxConfig;
    maintainAspectRatio: boolean;
}

Chart.register(...registerables, LogitScale, BarWithErrorBarsController, BarWithErrorBar);

const NO_DATA = 'noData';

const PrevalenceOverTimeBarChart = ({
    data,
    yAxisScaleType,
    confidenceIntervalMethod,
    yAxisMaxConfig,
    maintainAspectRatio,
}: PrevalenceOverTimeBarChartProps) => {
    const config = useMemo<ChartConfiguration | typeof NO_DATA>(() => {
        const nullFirstData = data
            .filter((prevalenceOverTimeData) => prevalenceOverTimeData.content.length > 0)
            .map((variantData) => {
                return {
                    content: variantData.content.sort(sortNullToBeginningThenByDate),
                    displayName: variantData.displayName,
                };
            });

        if (nullFirstData.length === 0) {
            return NO_DATA;
        }

        const datasets = nullFirstData.map((graphData, index) =>
            getDataset(graphData, index, confidenceIntervalMethod),
        );

        const maxY =
            yAxisScaleType !== 'logit'
                ? getYAxisMax(maxInData(nullFirstData), yAxisMaxConfig?.[yAxisScaleType])
                : undefined;

        return {
            type: BarWithErrorBarsController.id,
            data: {
                datasets,
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
                    tooltip: tooltip(confidenceIntervalMethod),
                },
            },
        };
    }, [data, yAxisScaleType, confidenceIntervalMethod, yAxisMaxConfig, maintainAspectRatio]);

    if (config === NO_DATA) {
        return <NoDataDisplay />;
    }

    return <GsChart configuration={config} />;
};

const getDataset = (
    prevalenceOverTimeVariant: PrevalenceOverTimeVariantData,
    index: number,
    confidenceIntervalMethod: ConfidenceIntervalMethod,
): ChartDataset<
    typeof BarWithErrorBarsController.id,
    {
        x: string;
        yMin: number | undefined;
        yMax: number | undefined;
        y: number;
    }[]
> => {
    return {
        borderWidth: 1,
        label: prevalenceOverTimeVariant.displayName,
        backgroundColor: singleGraphColorRGBAById(index, 0.3),
        borderColor: singleGraphColorRGBAById(index),
        data: prevalenceOverTimeVariant.content.map(mapDataPoint(confidenceIntervalMethod)),
    };
};

const mapDataPoint = (confidenceIntervalMethod: ConfidenceIntervalMethod) => {
    return (dataPoint: PrevalenceOverTimeVariantDataPoint) => {
        const confidenceInterval = getConfidenceInterval(dataPoint, confidenceIntervalMethod);
        return {
            y: dataPoint.prevalence,
            yMin: confidenceInterval.lowerLimit,
            yMax: confidenceInterval.upperLimit,
            x: dataPoint.dateRange?.toString() ?? 'Unknown',
        };
    };
};

const getConfidenceInterval = (
    dataPoint: PrevalenceOverTimeVariantDataPoint,
    confidenceIntervalMethod: ConfidenceIntervalMethod,
) => {
    switch (confidenceIntervalMethod) {
        case 'wilson':
            return wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total);
        default:
            return { lowerLimit: undefined, upperLimit: undefined };
    }
};

const tooltip = (confidenceIntervalMethod: ConfidenceIntervalMethod) => {
    const generalConfig = {
        mode: 'index' as const,
        intersect: false,
    };

    switch (confidenceIntervalMethod) {
        case 'wilson':
            return {
                ...generalConfig,
                callbacks: {
                    label: (context: TooltipItem<'barWithErrorBars'>) => {
                        const value = context.dataset.data[context.dataIndex] as {
                            y: number;
                            yMin: number;
                            yMax: number;
                        };

                        return `${context.dataset.label}: ${value.y.toFixed(3)} (${value.yMin.toFixed(3)} - ${value.yMax.toFixed(3)})`;
                    },
                },
            };
        default:
            return generalConfig;
    }
};

export default PrevalenceOverTimeBarChart;

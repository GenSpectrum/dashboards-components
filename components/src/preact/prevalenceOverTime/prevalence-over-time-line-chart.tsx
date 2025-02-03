import { Chart, type ChartConfiguration, registerables } from 'chart.js';
import { type TooltipItem } from 'chart.js/dist/types';

import { maxInData } from './prevalence-over-time';
import { type PrevalenceOverTimeData, type PrevalenceOverTimeVariantData } from '../../query/queryPrevalenceOverTime';
import GsChart from '../components/chart';
import { NoDataDisplay } from '../components/no-data-display';
import { LogitScale } from '../shared/charts/LogitScale';
import { singleGraphColorRGBAById } from '../shared/charts/colors';
import {
    confidenceIntervalDataLabel,
    type ConfidenceIntervalMethod,
    wilson95PercentConfidenceInterval,
} from '../shared/charts/confideceInterval';
import { getYAxisMax, type YAxisMaxConfig } from '../shared/charts/getYAxisMax';
import { getYAxisScale, type ScaleType } from '../shared/charts/getYAxisScale';

interface PrevalenceOverTimeLineChartProps {
    data: PrevalenceOverTimeData;
    yAxisScaleType: ScaleType;
    confidenceIntervalMethod: ConfidenceIntervalMethod;
    yAxisMaxConfig: YAxisMaxConfig;
    maintainAspectRatio: boolean;
}

Chart.register(...registerables, LogitScale);

const PrevalenceOverTimeLineChart = ({
    data,
    yAxisScaleType,
    confidenceIntervalMethod,
    yAxisMaxConfig,
    maintainAspectRatio,
}: PrevalenceOverTimeLineChartProps) => {
    const nonNullDateRangeData = data
        .filter((prevalenceOverTimeData) => prevalenceOverTimeData.content.length > 0)
        .map((variantData) => {
            return {
                content: variantData.content.filter((dataPoint) => dataPoint.dateRange !== null),
                displayName: variantData.displayName,
            };
        });

    if (nonNullDateRangeData.length === 0) {
        return <NoDataDisplay />;
    }

    const datasets = nonNullDateRangeData
        .map((graphData, index) => getDataset(graphData, index, confidenceIntervalMethod))
        .flat();

    const maxY =
        yAxisScaleType !== 'logit'
            ? getYAxisMax(maxInData(nonNullDateRangeData), yAxisMaxConfig?.[yAxisScaleType])
            : undefined;

    const config: ChartConfiguration = {
        type: 'line',
        data: {
            datasets,
        },
        options: {
            animation: false,
            maintainAspectRatio,
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

    return <GsChart configuration={config} />;
};

const getDataset = (
    prevalenceOverTimeVariant: PrevalenceOverTimeVariantData,
    dataIndex: number,
    confidenceIntervalMethod: ConfidenceIntervalMethod,
) => {
    switch (confidenceIntervalMethod) {
        case 'wilson':
            return [
                getDatasetCIUpper(prevalenceOverTimeVariant, dataIndex),
                getDatasetLine(prevalenceOverTimeVariant, dataIndex),
                getDatasetCILower(prevalenceOverTimeVariant, dataIndex),
            ].flat();
        default:
            return getDatasetLine(prevalenceOverTimeVariant, dataIndex);
    }
};

const getDatasetCIUpper = (prevalenceOverTimeVariant: PrevalenceOverTimeVariantData, dataIndex: number) => ({
    label: `${prevalenceOverTimeVariant.displayName} CI upper`,
    data: prevalenceOverTimeVariant.content.map((dataPoint): Datapoint => {
        return {
            y: wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total).upperLimit,
            x: dataPoint.dateRange?.toString(),
        };
    }),
    borderWidth: 0,
    pointRadius: 0,
    fill: '+1',
    backgroundColor: singleGraphColorRGBAById(dataIndex, 0.3),
});

const getDatasetCILower = (prevalenceOverTimeVariant: PrevalenceOverTimeVariantData, dataIndex: number) => ({
    label: `${prevalenceOverTimeVariant.displayName} CI lower`,
    data: prevalenceOverTimeVariant.content.map((dataPoint): Datapoint => {
        return {
            y: wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total).lowerLimit,
            x: dataPoint.dateRange?.toString(),
        };
    }),
    borderWidth: 0,
    pointRadius: 0,
    fill: '-1',
    backgroundColor: singleGraphColorRGBAById(dataIndex, 0.3),
});

const getDatasetLine = (prevalenceOverTimeVariant: PrevalenceOverTimeVariantData, dataIndex: number) => ({
    label: prevalenceOverTimeVariant.displayName,
    data: prevalenceOverTimeVariant.content.map((dataPoint): Datapoint => {
        const ciLimits = wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total);

        return {
            y: dataPoint.prevalence,
            x: dataPoint.dateRange?.toString(),
            yCiUpper: ciLimits.upperLimit,
            yCiLower: ciLimits.lowerLimit,
        };
    }),
    borderWidth: 1,
    pointRadius: 0,
    borderColor: singleGraphColorRGBAById(dataIndex),
    backgroundColor: singleGraphColorRGBAById(dataIndex),
});

interface Datapoint {
    y: number;
    yCiLower?: number;
    yCiUpper?: number;
    x?: string;
}

const tooltip = (confidenceIntervalMethod?: ConfidenceIntervalMethod) => {
    const generalConfig = {
        mode: 'index' as const,
        intersect: false,
    };

    switch (confidenceIntervalMethod) {
        case 'wilson':
            return {
                ...generalConfig,
                filter: ({ datasetIndex }: TooltipItem<'line'>) => {
                    return isNotCiIndex(datasetIndex);
                },
                callbacks: {
                    label: (context: TooltipItem<'line'>) => {
                        const dataPoint = context.dataset.data[context.dataIndex] as unknown as Datapoint;

                        return confidenceIntervalDataLabel(
                            dataPoint.y,
                            dataPoint.yCiLower,
                            dataPoint.yCiUpper,
                            context.dataset.label,
                        );
                    },
                },
            };
        default:
            return generalConfig;
    }
};

function isNotCiIndex(datasetIndex: number) {
    return datasetIndex % 3 === 1;
}

export default PrevalenceOverTimeLineChart;

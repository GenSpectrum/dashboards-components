import { Chart, type ChartConfiguration, registerables, type TooltipItem } from 'chart.js';
import { BarWithErrorBar, BarWithErrorBarsController } from 'chartjs-chart-error-bars';

import { type PrevalenceOverTimeData, type PrevalenceOverTimeVariantData } from '../../query/queryPrevalenceOverTime';
import GsChart from '../components/chart';
import { LogitScale } from '../shared/charts/LogitScale';
import { singleGraphColorRGBA } from '../shared/charts/colors';
import { type ConfidenceIntervalMethod, wilson95PercentConfidenceInterval } from '../shared/charts/confideceInterval';
import { getYAxisScale, type ScaleType } from '../shared/charts/getYAxisScale';

interface PrevalenceOverTimeBarChartProps {
    data: PrevalenceOverTimeData;
    yAxisScaleType: ScaleType;
    confidenceIntervalMethod: ConfidenceIntervalMethod;
}

Chart.register(...registerables, LogitScale, BarWithErrorBarsController, BarWithErrorBar);

const PrevalenceOverTimeBarChart = ({
    data,
    yAxisScaleType,
    confidenceIntervalMethod,
}: PrevalenceOverTimeBarChartProps) => {
    const config: ChartConfiguration = {
        type: BarWithErrorBarsController.id,
        data: {
            labels: data[0]?.content.map((dateRange) => dateRange.dateRange?.toString() ?? 'Unknown') || [],
            datasets: data.map((graphData, index) => datasets(graphData, index, confidenceIntervalMethod)),
        },
        options: {
            animation: false,
            scales: {
                // @ts-expect-error-next-line -- chart.js typings are not complete with custom scales
                y: getYAxisScale(yAxisScaleType),
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

const datasets = (
    prevalenceOverTimeVariant: PrevalenceOverTimeVariantData,
    index: number,
    confidenceIntervalMethod: ConfidenceIntervalMethod,
) => {
    const generalConfig = {
        borderWidth: 1,
        pointRadius: 0,
        label: prevalenceOverTimeVariant.displayName,
        backgroundColor: singleGraphColorRGBA(index, 0.3),
        borderColor: singleGraphColorRGBA(index),
    };

    switch (confidenceIntervalMethod) {
        case 'wilson':
            return {
                ...generalConfig,
                data: prevalenceOverTimeVariant.content.map((dataPoint) => ({
                    y: dataPoint.prevalence,
                    yMin: wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total).lowerLimit,
                    yMax: wilson95PercentConfidenceInterval(dataPoint.count, dataPoint.total).upperLimit,
                })),
            };
        default:
            return {
                ...generalConfig,
                data: prevalenceOverTimeVariant.content.map((dataPoint) => dataPoint.prevalence),
            };
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

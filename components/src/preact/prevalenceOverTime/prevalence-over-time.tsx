import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import z from 'zod';

import { getPrevalenceOverTimeTableData } from './getPrevalenceOverTimeTableData';
import PrevalenceOverTimeBarChart from './prevalence-over-time-bar-chart';
import PrevalenceOverTimeBubbleChart from './prevalence-over-time-bubble-chart';
import PrevalenceOverTimeLineChart from './prevalence-over-time-line-chart';
import PrevalenceOverTimeTable from './prevalence-over-time-table';
import { type PrevalenceOverTimeData, queryPrevalenceOverTime } from '../../query/queryPrevalenceOverTime';
import { lapisFilterSchema, namedLapisFilterSchema, temporalGranularitySchema, views } from '../../types';
import { useLapisUrl } from '../LapisUrlContext';
import { ConfidenceIntervalSelector } from '../components/confidence-interval-selector';
import { CsvDownloadButton } from '../components/csv-download-button';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoHeadline2, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { NoDataDisplay } from '../components/no-data-display';
import { ResizeContainer } from '../components/resize-container';
import { ScalingSelector } from '../components/scaling-selector';
import Tabs from '../components/tabs';
import { type ConfidenceIntervalMethod, confidenceIntervalMethodSchema } from '../shared/charts/confideceInterval';
import { getMaintainAspectRatio } from '../shared/charts/getMaintainAspectRatio';
import { axisMaxSchema } from '../shared/charts/getYAxisMax';
import { type ScaleType } from '../shared/charts/getYAxisScale';
import { useQuery } from '../useQuery';

const prevalenceOverTimeViewSchema = z.union([
    z.literal(views.table),
    z.literal(views.bar),
    z.literal(views.line),
    z.literal(views.bubble),
]);
export type PrevalenceOverTimeView = z.infer<typeof prevalenceOverTimeViewSchema>;

const prevalenceOverTimePropsSchema = z.object({
    width: z.string(),
    height: z.string().optional(),
    numeratorFilters: z.array(namedLapisFilterSchema).min(1),
    denominatorFilter: lapisFilterSchema,
    granularity: temporalGranularitySchema,
    smoothingWindow: z.number(),
    views: z.array(prevalenceOverTimeViewSchema),
    confidenceIntervalMethods: z.array(confidenceIntervalMethodSchema),
    lapisDateField: z.string().min(1),
    pageSize: z.union([z.boolean(), z.number()]),
    yAxisMaxLinear: axisMaxSchema,
    yAxisMaxLogarithmic: axisMaxSchema,
});

export type PrevalenceOverTimeProps = z.infer<typeof prevalenceOverTimePropsSchema>;

export const PrevalenceOverTime: FunctionComponent<PrevalenceOverTimeProps> = (componentProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} schema={prevalenceOverTimePropsSchema} componentProps={componentProps}>
            <ResizeContainer size={size}>
                <PrevalenceOverTimeInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

export const PrevalenceOverTimeInner: FunctionComponent<PrevalenceOverTimeProps> = (componentProps) => {
    const { numeratorFilters, denominatorFilter, granularity, smoothingWindow, lapisDateField } = componentProps;
    const lapis = useLapisUrl();

    const { data, error, isLoading } = useQuery(
        () =>
            queryPrevalenceOverTime(
                numeratorFilters,
                denominatorFilter,
                granularity,
                smoothingWindow,
                lapis,
                lapisDateField,
            ),
        [lapis, numeratorFilters, denominatorFilter, granularity, smoothingWindow, lapisDateField],
    );

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        throw error;
    }

    if (data === null || data.every((variant) => variant.content.length === 0)) {
        return <NoDataDisplay />;
    }

    return <PrevalenceOverTimeTabs data={data} {...componentProps} />;
};

type PrevalenceOverTimeTabsProps = PrevalenceOverTimeProps & {
    data: PrevalenceOverTimeData;
};

const PrevalenceOverTimeTabs: FunctionComponent<PrevalenceOverTimeTabsProps> = ({ data, ...componentProps }) => {
    const { views, granularity, confidenceIntervalMethods, pageSize, yAxisMaxLinear, yAxisMaxLogarithmic } =
        componentProps;
    const [yAxisScaleType, setYAxisScaleType] = useState<ScaleType>('linear');
    const [confidenceIntervalMethod, setConfidenceIntervalMethod] = useState<ConfidenceIntervalMethod>(
        confidenceIntervalMethods.length > 0 ? confidenceIntervalMethods[0] : 'none',
    );

    useEffect(() => {
        setConfidenceIntervalMethod((confidenceIntervalMethod) => {
            if (!confidenceIntervalMethods.includes(confidenceIntervalMethod)) {
                return confidenceIntervalMethods.length > 0 ? confidenceIntervalMethods[0] : 'none';
            }
            return confidenceIntervalMethod;
        });
    }, [confidenceIntervalMethods]);

    const yAxisMaxConfig = { linear: yAxisMaxLinear, logarithmic: yAxisMaxLogarithmic };
    const maintainAspectRatio = getMaintainAspectRatio(componentProps.height);

    const getTab = (view: PrevalenceOverTimeView) => {
        switch (view) {
            case 'bar':
                return {
                    title: 'Bar',
                    content: (
                        <PrevalenceOverTimeBarChart
                            data={data}
                            yAxisScaleType={yAxisScaleType}
                            confidenceIntervalMethod={confidenceIntervalMethod}
                            yAxisMaxConfig={yAxisMaxConfig}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            case 'line':
                return {
                    title: 'Line',
                    content: (
                        <PrevalenceOverTimeLineChart
                            data={data}
                            yAxisScaleType={yAxisScaleType}
                            confidenceIntervalMethod={confidenceIntervalMethod}
                            yAxisMaxConfig={yAxisMaxConfig}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            case 'bubble':
                return {
                    title: 'Bubble',
                    content: (
                        <PrevalenceOverTimeBubbleChart
                            data={data}
                            yAxisScaleType={yAxisScaleType}
                            yAxisMaxConfig={yAxisMaxConfig}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            case 'table':
                return {
                    title: 'Table',
                    content: <PrevalenceOverTimeTable data={data} granularity={granularity} pageSize={pageSize} />,
                };
        }
    };

    const tabs = views.map((view) => getTab(view));

    const toolbar = (activeTab: string) => (
        <Toolbar
            activeTab={activeTab}
            yAxisScaleType={yAxisScaleType}
            setYAxisScaleType={setYAxisScaleType}
            data={data}
            confidenceIntervalMethod={confidenceIntervalMethod}
            setConfidenceIntervalMethod={setConfidenceIntervalMethod}
            {...componentProps}
        />
    );

    return <Tabs tabs={tabs} toolbar={toolbar} />;
};

type ToolbarProps = PrevalenceOverTimeProps & {
    activeTab: string;
    data: PrevalenceOverTimeData;
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    confidenceIntervalMethods: ConfidenceIntervalMethod[];
    confidenceIntervalMethod: ConfidenceIntervalMethod;
    setConfidenceIntervalMethod: (confidenceIntervalMethod: ConfidenceIntervalMethod) => void;
};

const Toolbar: FunctionComponent<ToolbarProps> = ({
    activeTab,
    yAxisScaleType,
    setYAxisScaleType,
    confidenceIntervalMethod,
    setConfidenceIntervalMethod,
    data,
    ...componentProps
}) => {
    const { confidenceIntervalMethods, granularity } = componentProps;
    return (
        <>
            {activeTab !== 'Table' && (
                <ScalingSelector yAxisScaleType={yAxisScaleType} setYAxisScaleType={setYAxisScaleType} />
            )}
            {(activeTab === 'Bar' || activeTab === 'Line') && (
                <ConfidenceIntervalSelector
                    confidenceIntervalMethods={confidenceIntervalMethods}
                    confidenceIntervalMethod={confidenceIntervalMethod}
                    setConfidenceIntervalMethod={setConfidenceIntervalMethod}
                />
            )}
            <CsvDownloadButton
                className='mx-1 btn btn-xs'
                getData={() => getPrevalenceOverTimeTableData(data, granularity)}
                filename='prevalence_over_time.csv'
            />

            <PrevalenceOverTimeInfo {...componentProps} />
            <Fullscreen />
        </>
    );
};

const PrevalenceOverTimeInfo: FunctionComponent<PrevalenceOverTimeProps> = (componentProps) => {
    const { granularity, smoothingWindow, views } = componentProps;
    const lapis = useLapisUrl();
    return (
        <Info>
            <InfoHeadline1>Prevalence over time</InfoHeadline1>
            <InfoParagraph>
                This presents the proportion of one or more variants per <b>{granularity}</b>
                {smoothingWindow > 0 && `, smoothed using a ${smoothingWindow}-${granularity} sliding window`}. The
                proportion is calculated as the number of sequences of the variant(s) divided by the number of sequences
                that match the <code>denominatorFilter</code> (see below).
            </InfoParagraph>
            <InfoParagraph>
                Sequences that have no assigned date will not be shown in the line and bubble chart. They will show up
                in the bar and table view with date "unknown".
            </InfoParagraph>
            {views.includes('bubble') && (
                <>
                    <InfoHeadline2>Bubble chart</InfoHeadline2>
                    <InfoParagraph>
                        The size of the bubble scales with the total number of available sequences from the{' '}
                        {granularity}.
                    </InfoParagraph>
                </>
            )}
            <InfoComponentCode componentName='prevalence-over-time' params={componentProps} lapisUrl={lapis} />
        </Info>
    );
};

export const maxInData = (data: PrevalenceOverTimeData) =>
    Math.max(...data.flatMap((variant) => variant.content.map((dataPoint) => dataPoint.prevalence)));

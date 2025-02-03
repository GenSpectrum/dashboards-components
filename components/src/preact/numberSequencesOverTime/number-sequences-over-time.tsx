import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import z from 'zod';

import { getNumberOfSequencesOverTimeTableData } from './getNumberOfSequencesOverTimeTableData';
import { NumberSequencesOverTimeBarChart } from './number-sequences-over-time-bar-chart';
import { NumberSequencesOverTimeLineChart } from './number-sequences-over-time-line-chart';
import { NumberSequencesOverTimeTable } from './number-sequences-over-time-table';
import {
    type NumberOfSequencesDatasets,
    queryNumberOfSequencesOverTime,
} from '../../query/queryNumberOfSequencesOverTime';
import { namedLapisFilterSchema, temporalGranularitySchema, views } from '../../types';
import { useLapisUrl } from '../LapisUrlContext';
import { CsvDownloadButton } from '../components/csv-download-button';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { NoDataDisplay } from '../components/no-data-display';
import { ResizeContainer } from '../components/resize-container';
import { ScalingSelector } from '../components/scaling-selector';
import Tabs from '../components/tabs';
import { getMaintainAspectRatio } from '../shared/charts/getMaintainAspectRatio';
import type { ScaleType } from '../shared/charts/getYAxisScale';
import { useQuery } from '../useQuery';

const numberSequencesOverTimeViewSchema = z.union([
    z.literal(views.bar),
    z.literal(views.line),
    z.literal(views.table),
]);
export type NumberSequencesOverTimeView = z.infer<typeof numberSequencesOverTimeViewSchema>;

const numberSequencesOverTimePropsSchema = z.object({
    width: z.string(),
    height: z.string().optional(),
    lapisFilters: z.array(namedLapisFilterSchema).min(1),
    lapisDateField: z.string().min(1),
    views: z.array(numberSequencesOverTimeViewSchema),
    granularity: temporalGranularitySchema,
    smoothingWindow: z.number(),
    pageSize: z.union([z.boolean(), z.number()]),
});

export type NumberSequencesOverTimeProps = z.infer<typeof numberSequencesOverTimePropsSchema>;

export const NumberSequencesOverTime = (componentProps: NumberSequencesOverTimeProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} componentProps={componentProps} schema={numberSequencesOverTimePropsSchema}>
            <ResizeContainer size={size}>
                <NumberSequencesOverTimeInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

const NumberSequencesOverTimeInner = (componentProps: NumberSequencesOverTimeProps) => {
    const { lapisFilters, lapisDateField, granularity, smoothingWindow } = componentProps;
    const lapis = useLapisUrl();

    const { data, error, isLoading } = useQuery(
        () => queryNumberOfSequencesOverTime(lapis, lapisFilters, lapisDateField, granularity, smoothingWindow),
        [lapis, lapisFilters, lapisDateField, granularity, smoothingWindow],
    );

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        throw error;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return <NumberSequencesOverTimeTabs data={data} originalComponentProps={componentProps} />;
};

interface NumberSequencesOverTimeTabsProps {
    data: NumberOfSequencesDatasets;
    originalComponentProps: NumberSequencesOverTimeProps;
}

const NumberSequencesOverTimeTabs = ({ data, originalComponentProps }: NumberSequencesOverTimeTabsProps) => {
    const [yAxisScaleType, setYAxisScaleType] = useState<ScaleType>('linear');

    const maintainAspectRatio = getMaintainAspectRatio(originalComponentProps.height);

    const getTab = (view: NumberSequencesOverTimeView) => {
        switch (view) {
            case 'bar':
                return {
                    title: 'Bar',
                    content: (
                        <NumberSequencesOverTimeBarChart
                            data={data}
                            yAxisScaleType={yAxisScaleType}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            case 'line':
                return {
                    title: 'Line',
                    content: (
                        <NumberSequencesOverTimeLineChart
                            data={data}
                            yAxisScaleType={yAxisScaleType}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            case 'table':
                return {
                    title: 'Table',
                    content: (
                        <NumberSequencesOverTimeTable
                            data={data}
                            granularity={originalComponentProps.granularity}
                            pageSize={originalComponentProps.pageSize}
                        />
                    ),
                };
            default:
                throw new Error(`Unknown view: ${view}`);
        }
    };

    return (
        <Tabs
            tabs={originalComponentProps.views.map((view) => getTab(view))}
            toolbar={(activeTab) => (
                <Toolbar
                    activeTab={activeTab}
                    data={data}
                    yAxisScaleType={yAxisScaleType}
                    setYAxisScaleType={setYAxisScaleType}
                    originalComponentProps={originalComponentProps}
                />
            )}
        />
    );
};

interface ToolbarProps {
    activeTab: string;
    data: NumberOfSequencesDatasets;
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    originalComponentProps: NumberSequencesOverTimeProps;
}

const Toolbar = ({ activeTab, data, yAxisScaleType, setYAxisScaleType, originalComponentProps }: ToolbarProps) => {
    return (
        <>
            {activeTab !== 'Table' && (
                <ScalingSelector
                    yAxisScaleType={yAxisScaleType}
                    setYAxisScaleType={setYAxisScaleType}
                    enabledTypes={['linear', 'logarithmic']}
                />
            )}
            <CsvDownloadButton
                className='mx-1 btn btn-xs'
                getData={() => getNumberOfSequencesOverTimeTableData(data, originalComponentProps.granularity)}
                filename='number_of_sequences_over_time.csv'
            />
            <NumberSequencesOverTimeInfo originalComponentProps={originalComponentProps} />
            <Fullscreen />
        </>
    );
};

type NumberSequencesOverTimeInfoProps = {
    originalComponentProps: NumberSequencesOverTimeProps;
};

const NumberSequencesOverTimeInfo: FunctionComponent<NumberSequencesOverTimeInfoProps> = ({
    originalComponentProps,
}) => {
    const lapis = useLapisUrl();

    return (
        <Info>
            <InfoHeadline1>Number of sequences over time</InfoHeadline1>
            <InfoParagraph>
                This presents the number of available sequences of a variant per{' '}
                <b>{originalComponentProps.granularity}</b>
                {originalComponentProps.smoothingWindow > 0 &&
                    `, smoothed using a ${originalComponentProps.smoothingWindow}-${originalComponentProps.granularity} sliding window`}
                .
            </InfoParagraph>
            <InfoComponentCode
                componentName='number-sequences-over-time'
                params={originalComponentProps}
                lapisUrl={lapis}
            />
        </Info>
    );
};

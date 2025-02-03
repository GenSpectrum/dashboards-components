import type { FunctionComponent } from 'preact';
import z from 'zod';

import { useLapisUrl } from '../LapisUrlContext';
import { SequencesByLocationMap } from './sequences-by-location-map';
import { SequencesByLocationTable } from './sequences-by-location-table';
import {
    type EnhancedLocationsTableData,
    type MapLocationData,
    MapLocationDataType,
} from '../../query/computeMapLocationData';
import { type AggregateData } from '../../query/queryAggregateData';
import { querySequencesByLocationData } from '../../query/querySequencesByLocationData';
import { CsvDownloadButton } from '../components/csv-download-button';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { ResizeContainer } from '../components/resize-container';
import { useQuery } from '../useQuery';
import { mapSourceSchema } from './loadMapSource';
import { lapisFilterSchema, views } from '../../types';
import Tabs from '../components/tabs';
import { getMaintainAspectRatio } from '../shared/charts/getMaintainAspectRatio';

export const sequencesByLocationViewSchema = z.union([z.literal(views.map), z.literal(views.table)]);
export type SequencesByLocationMapView = z.infer<typeof sequencesByLocationViewSchema>;

const sequencesByLocationPropsSchema = z.object({
    lapisFilter: lapisFilterSchema,
    lapisLocationField: z.string().min(1),
    mapSource: mapSourceSchema.optional(),
    enableMapNavigation: z.boolean(),
    width: z.string(),
    height: z.string().optional(),
    views: z.array(sequencesByLocationViewSchema),
    zoom: z.number(),
    offsetX: z.number(),
    offsetY: z.number(),
    pageSize: z.union([z.boolean(), z.number()]),
});

export type SequencesByLocationProps = z.infer<typeof sequencesByLocationPropsSchema>;

export const SequencesByLocation: FunctionComponent<SequencesByLocationProps> = (componentProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} componentProps={componentProps} schema={sequencesByLocationPropsSchema}>
            <ResizeContainer size={size}>
                <SequencesByLocationMapInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

const SequencesByLocationMapInner: FunctionComponent<SequencesByLocationProps> = (props) => {
    const { lapisFilter, lapisLocationField, mapSource } = props;

    const lapis = useLapisUrl();
    const {
        data,
        error,
        isLoading: isLoadingLapisData,
    } = useQuery(
        async () => querySequencesByLocationData(lapisFilter, lapisLocationField, lapis, mapSource),
        [lapisFilter, lapisLocationField, lapis, mapSource],
    );

    if (isLoadingLapisData) {
        return <LoadingDisplay />;
    }

    if (error) {
        throw error;
    }

    return <SequencesByLocationMapTabs data={data} originalComponentProps={props} />;
};

type SequencesByLocationMapTabsProps = {
    originalComponentProps: SequencesByLocationProps;
    data: MapLocationData;
};

const SequencesByLocationMapTabs: FunctionComponent<SequencesByLocationMapTabsProps> = ({
    originalComponentProps,
    data,
}) => {
    const maintainAspectRatio = getMaintainAspectRatio(originalComponentProps.height);

    const getTab = (view: SequencesByLocationMapView) => {
        switch (view) {
            case views.map: {
                if (data.type !== MapLocationDataType.tableAndMapData) {
                    throw new Error('mapSource is required when using the map view');
                }
                const { type: _type, tableData: _tableData, ...dataForMap } = data;
                return {
                    title: 'Map',
                    content: (
                        <SequencesByLocationMap
                            {...dataForMap}
                            enableMapNavigation={originalComponentProps.enableMapNavigation}
                            lapisLocationField={originalComponentProps.lapisLocationField}
                            zoom={originalComponentProps.zoom}
                            offsetX={originalComponentProps.offsetX}
                            offsetY={originalComponentProps.offsetY}
                            hasTableView={originalComponentProps.views.includes(views.table)}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
            }
            case views.table:
                return {
                    title: 'Table',
                    content: (
                        <SequencesByLocationTable
                            tableData={data.tableData}
                            lapisLocationField={originalComponentProps.lapisLocationField}
                            pageSize={originalComponentProps.pageSize}
                        />
                    ),
                };
        }
    };

    const tabs = originalComponentProps.views.map((view) => getTab(view));

    return (
        <Tabs
            tabs={tabs}
            toolbar={<Toolbar originalComponentProps={originalComponentProps} tableData={data.tableData} />}
        />
    );
};

type ToolbarProps = {
    originalComponentProps: SequencesByLocationProps;
    tableData: AggregateData | EnhancedLocationsTableData;
};

const Toolbar: FunctionComponent<ToolbarProps> = ({ originalComponentProps, tableData }) => {
    return (
        <div class='flex flex-row'>
            <CsvDownloadButton
                className='mx-1 btn btn-xs'
                getData={() => tableData}
                filename='sequences_by_location.csv'
            />
            <SequencesByLocationMapInfo originalComponentProps={originalComponentProps} />
            <Fullscreen />
        </div>
    );
};

type SequencesByLocationMapInfoProps = {
    originalComponentProps: SequencesByLocationProps;
};

const SequencesByLocationMapInfo: FunctionComponent<SequencesByLocationMapInfoProps> = ({ originalComponentProps }) => {
    const lapis = useLapisUrl();
    return (
        <Info>
            <InfoHeadline1>Prevalence by location</InfoHeadline1>
            <InfoParagraph>
                TODO: Add description https://github.com/GenSpectrum/dashboard-components/issues/598
            </InfoParagraph>
            <InfoComponentCode componentName='sequences-by-location' params={originalComponentProps} lapisUrl={lapis} />
        </Info>
    );
};

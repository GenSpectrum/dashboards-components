import type { Feature, Geometry, GeometryObject } from 'geojson';
import { geoJson, type Layer, type LayerGroup, map } from 'leaflet';
import type { FunctionComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import type { EnhancedGeoJsonFeatureProperties } from '../../query/computeMapLocationData';
import { InfoHeadline1, InfoParagraph } from '../components/info';
import { Modal, useModalRef } from '../components/modal';
import { AspectRatio } from '../shared/aspectRatio/AspectRatio';
import { formatProportion } from '../shared/table/formatProportion';

type SequencesByLocationMapProps = {
    locations: Feature<Geometry, EnhancedGeoJsonFeatureProperties>[];
    totalCount: number;
    countOfMatchedLocationData: number;
    nullCount: number;
    unmatchedLocations: string[];
    enableMapNavigation: boolean;
    lapisLocationField: string;
    zoom: number;
    offsetX: number;
    offsetY: number;
    hasTableView: boolean;
    maintainAspectRatio: boolean;
};

export const SequencesByLocationMap: FunctionComponent<SequencesByLocationMapProps> = ({
    locations,
    totalCount,
    countOfMatchedLocationData,
    nullCount,
    unmatchedLocations,
    enableMapNavigation,
    lapisLocationField,
    zoom,
    offsetX,
    offsetY,
    hasTableView,
    maintainAspectRatio,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const leafletMap = map(ref.current, {
            scrollWheelZoom: enableMapNavigation,
            zoomControl: enableMapNavigation,
            keyboard: enableMapNavigation,
            dragging: enableMapNavigation,
            zoomSnap: 0,
            zoom,
            center: [offsetY, offsetX],
        });

        geoJson(locations, {
            style: (feature: Feature<GeometryObject, EnhancedGeoJsonFeatureProperties> | undefined) => ({
                fillColor: getColor(feature?.properties.data?.proportion),
                fillOpacity: 1,
                color: '#666666',
                weight: 1,
            }),
        })
            .bindTooltip(createTooltip)
            .addTo(leafletMap);

        return () => {
            leafletMap.remove();
        };
    }, [ref, locations, enableMapNavigation, lapisLocationField, zoom, offsetX, offsetY]);

    return (
        <AspectRatio aspectRatio={maintainAspectRatio ? 50 : undefined}>
            <div className='h-full' ref={ref}>
                <div className='relative'>
                    <DataMatchInformation
                        totalCount={totalCount}
                        countOfMatchedLocationData={countOfMatchedLocationData}
                        unmatchedLocations={unmatchedLocations}
                        nullCount={nullCount}
                        hasTableView={hasTableView}
                    />
                </div>
            </div>
        </AspectRatio>
    );
};

type DataMatchInformationProps = {
    totalCount: number;
    countOfMatchedLocationData: number;
    unmatchedLocations: string[];
    nullCount: number;
    hasTableView: boolean;
};

const DataMatchInformation: FunctionComponent<DataMatchInformationProps> = ({
    totalCount,
    countOfMatchedLocationData,
    unmatchedLocations,
    nullCount,
    hasTableView,
}) => {
    const modalRef = useModalRef();

    const proportion = formatProportion(countOfMatchedLocationData / totalCount);

    return (
        <>
            <button
                onClick={() => modalRef.current?.showModal()}
                className='text-sm absolute bottom-0 px-1 z-[1001] bg-white rounded border cursor-pointer tooltip'
                data-tip='Click for detailed information'
            >
                This map shows {proportion} of the data.
            </button>
            <Modal modalRef={modalRef}>
                <InfoHeadline1>Sequences By Location - Map View</InfoHeadline1>
                <InfoParagraph>
                    The current filter has matched {totalCount.toLocaleString('en-us')} sequences. From these sequences,
                    we were able to match {countOfMatchedLocationData.toLocaleString('en-us')} ({proportion}) on
                    locations on the map.
                </InfoParagraph>
                <InfoParagraph>
                    {unmatchedLocations.length > 0 && (
                        <>
                            The following locations from the data could not be matched on the map:{' '}
                            {unmatchedLocations.map((it) => `"${it}"`).join(', ')}.{' '}
                        </>
                    )}
                    {nullCount > 0 &&
                        `${nullCount.toLocaleString('en-us')} matching sequences have no location information. `}
                    {hasTableView && 'You can check the table view for more detailed information.'}
                </InfoParagraph>
            </Modal>
        </>
    );
};

function getColor(value: number | undefined): string {
    if (value === undefined) {
        return '#DDDDDD';
    }

    const thresholds = [
        { limit: 0.4, color: '#662506' },
        { limit: 0.3, color: '#993404' },
        { limit: 0.2, color: '#CC4C02' },
        { limit: 0.1, color: '#EC7014' },
        { limit: 0.05, color: '#FB9A29' },
        { limit: 0.02, color: '#FEC44F' },
        { limit: 0.01, color: '#FEE391' },
        { limit: 0.005, color: '#FFF7BC' },
        { limit: 0.002, color: '#FFFFE5' },
    ];

    for (const { limit, color } of thresholds) {
        if (value > limit) {
            return color;
        }
    }

    return '#FFFFE5';
}

function createTooltip(layer: Layer) {
    const feature = (layer as LayerGroup<EnhancedGeoJsonFeatureProperties>).feature;
    if (feature === undefined || feature.type !== 'Feature') {
        return '';
    }
    const properties = feature.properties;

    const div = document.createElement('div');
    div.appendChild(p({ innerText: properties.name, className: 'font-bold' }));
    if (properties.data !== null) {
        div.appendChild(
            p({
                innerText: `Count: ${properties.data.count.toLocaleString('en-us')}`,
            }),
        );
        div.appendChild(
            p({
                innerText: `Proportion: ${formatProportion(properties.data.proportion)}`,
            }),
        );
    } else {
        div.appendChild(p({ innerText: 'No data' }));
    }
    return div;
}

function p({ innerText, className = '' }: { innerText: string; className?: string }) {
    const headline = document.createElement('p');
    headline.innerText = innerText;
    headline.className = className;
    return headline;
}

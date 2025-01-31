import { computeMapLocationData } from './computeMapLocationData';
import { queryAggregateData } from './queryAggregateData';
import { loadMapSource, type MapSource } from '../preact/sequencesByLocation/loadMapSource';
import type { LapisFilter } from '../types';

export async function querySequencesByLocationData(
    lapisFilter: LapisFilter,
    lapisLocationField: string,
    lapis: string,
    mapSource: MapSource | undefined,
) {
    const [locationData, geojsonData] = await Promise.all([
        queryAggregateData(lapisFilter, [lapisLocationField], lapis),
        mapSource !== undefined ? loadMapSource(mapSource) : undefined,
    ]);

    return computeMapLocationData(locationData, geojsonData, lapisLocationField);
}

import type { Feature, FeatureCollection, GeometryObject } from 'geojson';

import type { AggregateData } from './queryAggregateData';
import type { GeoJsonFeatureProperties } from '../preact/sequencesByLocation/loadMapSource';

export type FeatureData = { proportion: number; count: number };

export type EnhancedGeoJsonFeatureProperties = GeoJsonFeatureProperties & {
    data: FeatureData | null;
};

export type EnhancedLocationsTableData = (AggregateData[number] & { isShownOnMap: string })[];

export const MapLocationDataType = {
    tableDataOnly: 'tableDataOnly',
    tableAndMapData: 'tableAndMapData',
} as const;

export type MapLocationData =
    | {
          type: typeof MapLocationDataType.tableDataOnly;
          tableData: AggregateData;
      }
    | {
          type: typeof MapLocationDataType.tableAndMapData;
          locations: Feature<GeometryObject, EnhancedGeoJsonFeatureProperties>[];
          tableData: EnhancedLocationsTableData;
          totalCount: number;
          countOfMatchedLocationData: number;
          unmatchedLocations: string[];
          nullCount: number;
      };

export function computeMapLocationData(
    locationData: AggregateData,
    geojsonData: FeatureCollection<GeometryObject, GeoJsonFeatureProperties> | undefined,
    lapisLocationField: string,
): MapLocationData {
    if (geojsonData === undefined) {
        return { type: MapLocationDataType.tableDataOnly, tableData: locationData };
    }

    const countAndProportionByCountry = buildLookupByLocationField(locationData, lapisLocationField);
    const { locations, unmatchedLocations } = matchLocationDataAndGeoJsonFeatures(
        geojsonData,
        countAndProportionByCountry,
        lapisLocationField,
    );

    const totalCount = locationData.map((value) => value.count).reduce((sum, b) => sum + b, 0);
    const countOfMatchedLocationData = locations
        .map((location) => location.properties.data?.count ?? 0)
        .reduce((sum, b) => sum + b, 0);
    const nullCount = locationData.find((row) => row[lapisLocationField] === null)?.count ?? 0;

    const tableData = getSequencesByLocationTableData(locationData, unmatchedLocations, lapisLocationField);

    return {
        type: MapLocationDataType.tableAndMapData,
        locations,
        tableData,
        totalCount,
        countOfMatchedLocationData,
        unmatchedLocations,
        nullCount,
    };
}

function buildLookupByLocationField(locationData: AggregateData, lapisLocationField: string) {
    return new Map<string, FeatureData>(
        locationData
            .filter((row) => typeof row[lapisLocationField] === 'string')
            .map((row) => [row[lapisLocationField] as string, row]),
    );
}

function matchLocationDataAndGeoJsonFeatures(
    geojsonData: FeatureCollection<GeometryObject, GeoJsonFeatureProperties>,
    countAndProportionByCountry: Map<string, FeatureData>,
    lapisLocationField: string,
) {
    const matchedLocations: string[] = [];

    const locations: Feature<GeometryObject, EnhancedGeoJsonFeatureProperties>[] = geojsonData.features.map(
        (feature) => {
            const name = feature?.properties?.name;
            if (typeof name !== 'string') {
                throw new Error(
                    `GeoJSON feature with id '${feature.id}' does not have 'properties.name' of type string, was: '${name}'`,
                );
            }

            const data = countAndProportionByCountry.get(name) ?? null;
            if (data !== null) {
                matchedLocations.push(name);
            }
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    data,
                },
            };
        },
    );

    const unmatchedLocations = [...countAndProportionByCountry.keys()].filter(
        (name) => !matchedLocations.includes(name),
    );
    if (unmatchedLocations.length > 0) {
        const unmatchedLocationsWarning = `gs-map: Found location data from LAPIS (aggregated by "${lapisLocationField}") that could not be matched on locations on the given map. Unmatched location names are: ${unmatchedLocations.map((it) => `"${it}"`).join(', ')}`;
        console.warn(unmatchedLocationsWarning); // eslint-disable-line no-console -- We should give some feedback about unmatched location data.
    }

    return { locations, unmatchedLocations };
}

export function getSequencesByLocationTableData(
    locationData: AggregateData,
    unmatchedLocations: string[],
    lapisLocationField: string,
): EnhancedLocationsTableData {
    return locationData.map((row) => ({
        ...row,
        isShownOnMap: `${isShownOnMap(row, unmatchedLocations, lapisLocationField)}`,
    }));
}

function isShownOnMap(row: AggregateData[number], unmatchedLocations: string[], lapisLocationField: string) {
    const locationValue = row[lapisLocationField];
    if (locationValue === null) {
        return false;
    }

    return !unmatchedLocations.includes(locationValue as string);
}

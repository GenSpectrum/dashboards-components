import type { FeatureCollection, GeometryObject } from 'geojson';
import { describe, expect, test } from 'vitest';

import { computeMapLocationData } from './computeMapLocationData';
import type { GeoJsonFeatureProperties } from '../preact/sequencesByLocation/loadMapSource';

const lapisLocationField = 'locationField';

const country1 = 'country1';
const country2 = 'country2';

const locationData = [
    {
        [lapisLocationField]: country1,
        count: 1,
        proportion: 0.1,
    },
    {
        [lapisLocationField]: country2,
        count: 2,
        proportion: 0.2,
    },
    {
        [lapisLocationField]: null,
        count: 3,
        proportion: 0.3,
    },
];

const geometryObject = {
    type: 'GeometryCollection',
    geometries: [],
} satisfies GeometryObject;

const geojsonData = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {
                name: country1,
            },
            geometry: geometryObject,
        },
    ],
} satisfies FeatureCollection<GeometryObject, GeoJsonFeatureProperties>;

describe('computeMapLocationData', () => {
    test('should return tableDataOnly when geojsonData is undefined', () => {
        const actual = computeMapLocationData(locationData, undefined, lapisLocationField);

        expect(actual).to.deep.equal({
            type: 'tableDataOnly',
            tableData: locationData,
        });
    });

    test('should return tableAndMapData when geojsonData is defined', () => {
        const actual = computeMapLocationData(locationData, geojsonData, lapisLocationField);

        expect(actual).to.deep.equal({
            type: 'tableAndMapData',
            locations: [
                {
                    type: 'Feature',
                    properties: {
                        name: country1,
                        data: {
                            count: 1,
                            proportion: 0.1,
                            [lapisLocationField]: country1,
                        },
                    },
                    geometry: geometryObject,
                },
            ],
            tableData: [
                {
                    [lapisLocationField]: country1,
                    count: 1,
                    proportion: 0.1,
                    isShownOnMap: 'true',
                },
                {
                    [lapisLocationField]: country2,
                    count: 2,
                    proportion: 0.2,
                    isShownOnMap: 'false',
                },
                {
                    [lapisLocationField]: null,
                    count: 3,
                    proportion: 0.3,
                    isShownOnMap: 'false',
                },
            ],
            totalCount: 6,
            countOfMatchedLocationData: 1,
            unmatchedLocations: [country2],
            nullCount: 3,
        });
    });
});

import { type Meta, type StoryObj } from '@storybook/preact';

import worldAtlas from './__mockData__/worldAtlas.json';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import aggregatedWorld from './__mockData__/aggregatedWorld.json';
import { SequencesByLocation, type SequencesByLocationProps } from './sequences-by-location';
import { expectInvalidAttributesErrorMessage, playThatExpectsErrorMessage } from '../shared/stories/expectErrorMessage';

import 'leaflet/dist/leaflet.css';
import './leafletStyleModifications.css';

const meta: Meta<SequencesByLocationProps> = {
    title: 'Visualization/SequencesByLocation',
    component: SequencesByLocation,
    argTypes: {
        lapisFilter: { control: 'object' },
        lapisLocationField: { control: { type: 'text' } },
        enableMapNavigation: { control: { type: 'boolean' } },
        width: { control: { type: 'text' } },
        height: { control: { type: 'text' } },
        views: {
            options: ['map', 'table'],
            control: { type: 'check' },
        },
        zoom: { control: { type: 'number' } },
        offsetX: { control: { type: 'number' } },
        offsetY: { control: { type: 'number' } },
        pageSize: { control: 'object' },
    },
};

export default meta;

const worldMapUrl = 'https://mock.map.data/world.topo.json';

const aggregatedWorldMatcher = {
    matcher: {
        name: 'aggregatedData',
        url: AGGREGATED_ENDPOINT,
        body: {
            fields: ['country'],
            dateFrom: '2022-01-01',
            dateTo: '2022-04-01',
        },
    },
    response: {
        status: 200,
        body: aggregatedWorld,
    },
};

export const Default: StoryObj<SequencesByLocationProps> = {
    render: (args) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <SequencesByLocation {...args} />
        </LapisUrlContextProvider>
    ),
    args: {
        lapisFilter: { dateFrom: '2022-01-01', dateTo: '2022-04-01' },
        lapisLocationField: 'country',
        mapSource: {
            type: 'topojson',
            url: worldMapUrl,
            topologyObjectsKey: 'countries',
        },
        enableMapNavigation: false,
        width: '1100px',
        views: ['map', 'table'],
        zoom: 2,
        offsetX: 0,
        offsetY: 10,
        pageSize: 10,
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'worldMap',
                        url: worldMapUrl,
                    },
                    response: {
                        status: 200,
                        body: worldAtlas,
                    },
                },
                aggregatedWorldMatcher,
            ],
        },
    },
};

export const InvalidTopoJsonTopology: StoryObj<SequencesByLocationProps> = {
    ...Default,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'worldMap',
                        url: worldMapUrl,
                    },
                    response: {
                        status: 200,
                        body: { type: 'not a topology' },
                    },
                },
                aggregatedWorldMatcher,
            ],
        },
    },
    play: playThatExpectsErrorMessage(
        'Error - Invalid map source',
        `does not look like a topojson Topology definition: missing 'type: "Topology"'`,
    ),
};

export const InvalidTopoJsonObjects: StoryObj<SequencesByLocationProps> = {
    ...Default,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'worldMap',
                        url: worldMapUrl,
                    },
                    response: {
                        status: 200,
                        body: { type: 'Topology', objects: 'invalid topology objects' },
                    },
                },
                aggregatedWorldMatcher,
            ],
        },
    },
    play: playThatExpectsErrorMessage(
        'Error - Invalid map source',
        `does not have a GeometryCollection at key objects.countries`,
    ),
};

export const InvalidProps: StoryObj<SequencesByLocationProps> = {
    ...Default,
    args: {
        ...Default.args,
        lapisLocationField: '',
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(
                canvasElement,
                '"lapisLocationField": String must contain at least 1 character(s)',
            );
        });
    },
};

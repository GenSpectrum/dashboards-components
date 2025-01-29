import { type StoryObj } from '@storybook/preact';

import { NumberSequencesOverTime, type NumberSequencesOverTimeProps } from './number-sequences-over-time';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import oneVariantEG from '../../preact/numberSequencesOverTime/__mockData__/oneVariantEG.json';
import twoVariantsEG from '../../preact/numberSequencesOverTime/__mockData__/twoVariantsEG.json';
import twoVariantsJN1 from '../../preact/numberSequencesOverTime/__mockData__/twoVariantsJN1.json';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import { expectInvalidAttributesErrorMessage } from '../shared/stories/expectErrorMessage';

export default {
    title: 'Visualization/NumberSequencesOverTime',
    component: NumberSequencesOverTime,
    parameters: {
        fetchMock: {},
    },
    argTypes: {
        granularity: {
            options: ['day', 'week', 'month', 'year'],
            control: { type: 'radio' },
        },
        views: {
            options: ['bar', 'line', 'table'],
            control: { type: 'check' },
        },
        pageSize: { control: 'object' },
        height: {
            control: 'text',
        },
    },
};

const Template: StoryObj<NumberSequencesOverTimeProps> = {
    render: (args) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <NumberSequencesOverTime {...args} />
        </LapisUrlContextProvider>
    ),
    args: {
        views: ['bar', 'line', 'table'],
        lapisFilters: [
            { displayName: 'EG', lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateFrom: '2022-12-01' } },
        ],
        lapisDateField: 'date',
        width: '100%',
        smoothingWindow: 0,
        granularity: 'month',
        pageSize: 10,
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregated',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            pangoLineage: 'EG*',
                            dateFrom: '2022-12-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: oneVariantEG,
                    },
                },
            ],
        },
    },
};

export const Table = {
    ...Template,
};

export const TwoVariants: StoryObj<NumberSequencesOverTimeProps> = {
    ...Template,
    args: {
        ...Template.args,
        lapisFilters: [
            { displayName: 'EG', lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateTo: '2023-06-30' } },
            { displayName: 'JN.1', lapisFilter: { country: 'USA', pangoLineage: 'JN.1*', dateFrom: '2023-01-01' } },
        ],
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregatedEG',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            pangoLineage: 'EG*',
                            dateTo: '2023-06-30',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: twoVariantsEG,
                    },
                },
                {
                    matcher: {
                        name: 'aggregatedJN.1',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            pangoLineage: 'JN.1*',
                            dateFrom: '2023-01-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: twoVariantsJN1,
                    },
                },
            ],
        },
    },
};

export const WithNoLapisDateField: StoryObj<NumberSequencesOverTimeProps> = {
    ...Template,
    args: {
        ...Template.args,
        lapisDateField: '',
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(canvasElement, 'String must contain at least 1 character(s)');
        });
    },
};

import { type StoryObj } from '@storybook/preact';
import { expect, waitFor, within } from '@storybook/test';

import denominator from './__mockData__/denominatorFilter.json';
import numerator from './__mockData__/numeratorFilter.json';
import { RelativeGrowthAdvantage, type RelativeGrowthAdvantageProps } from './relative-growth-advantage';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import { expectInvalidAttributesErrorMessage } from '../shared/stories/expectErrorMessage';

export default {
    title: 'Visualization/RelativeGrowthAdvantage',
    component: RelativeGrowthAdvantage,
    parameters: {
        fetchMock: {},
    },
    argTypes: {
        numeratorFilter: { control: 'object' },
        denominatorFilter: { control: 'object' },
        generationTime: { control: 'number' },
        views: {
            options: ['line'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        yAxisMaxConfig: { control: 'object' },
    },
};

export const Primary: StoryObj<RelativeGrowthAdvantageProps> = {
    render: (args: RelativeGrowthAdvantageProps) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <RelativeGrowthAdvantage {...args} />
        </LapisUrlContextProvider>
    ),
    args: {
        numeratorFilter: {
            country: 'Switzerland',
            pangoLineage: 'B.1.1.7',
            dateFrom: '2020-12-01',
            dateTo: '2021-03-01',
        },
        denominatorFilter: { country: 'Switzerland', dateFrom: '2020-12-01', dateTo: '2021-03-01' },
        generationTime: 7,
        views: ['line'],
        width: '100%',
        lapisDateField: 'date',
        yAxisMaxLinear: 1,
        yAxisMaxLogarithmic: 1,
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'numerator',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom: '2020-12-01',
                            dateTo: '2021-03-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: numerator,
                    },
                },
                {
                    matcher: {
                        name: 'denominator',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            dateFrom: '2020-12-01',
                            dateTo: '2021-03-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: denominator,
                    },
                },
            ],
        },
    },
};

export const TooFewDataToComputeGrowthAdvantage: StoryObj<RelativeGrowthAdvantageProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        numeratorFilter: {
            country: 'Switzerland',
            pangoLineage: 'B.1.1.7',
            dateFrom: '2021-02-28',
            dateTo: '2021-03-01',
        },
        denominatorFilter: {
            country: 'Switzerland',
            dateFrom: '2021-02-28',
            dateTo: '2021-03-01',
        },
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'numeratorFilter',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom: '2021-02-28',
                            dateTo: '2021-03-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: {
                            data: [
                                {
                                    date: '2021-02-28',
                                    count: 5,
                                },
                                {
                                    date: '2021-03-01',
                                    count: 5,
                                },
                            ],
                        },
                    },
                },
                {
                    matcher: {
                        name: 'denominatorFilter',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            dateFrom: '2021-02-28',
                            dateTo: '2021-03-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: {
                            data: [
                                {
                                    date: '2021-02-28',
                                    count: 5,
                                },
                                {
                                    date: '2021-03-01',
                                    count: 7,
                                },
                            ],
                        },
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(() => {
            const notEnoughDataMessage = canvas.queryByText(
                'It was not possible to estimate the relative growth advantage',
                { exact: false },
            );
            return expect(notEnoughDataMessage).toBeVisible();
        });
    },
};

export const WithNoLapisDateField: StoryObj<RelativeGrowthAdvantageProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        lapisDateField: '',
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(canvasElement, 'String must contain at least 1 character(s)');
        });
    },
};

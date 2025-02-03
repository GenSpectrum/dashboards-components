import { expect, fireEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../gs-app';
import './gs-prevalence-over-time';
import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import denominatorFilter from '../../preact/prevalenceOverTime/__mockData__/denominatorFilter.json';
import denominatorFilterOneDataset from '../../preact/prevalenceOverTime/__mockData__/denominatorFilterOneDataset.json';
import numeratorFilterEG from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterEG.json';
import numeratorFilterJN1 from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterJN1.json';
import numeratorFilterOneDataset from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterOneDataset.json';
import { type PrevalenceOverTimeProps } from '../../preact/prevalenceOverTime/prevalence-over-time';
import { withinShadowRoot } from '../withinShadowRoot.story';

const codeExample = String.raw`
<gs-prevalence-over-time
    numeratorFilter='[{ "displayName": "EG", "lapisFilter": { "country": "USA", "pangoLineage": "EG*" }}, { "displayName": "JN.1", "lapisFilter": { "country": "USA", "pangoLineage": "JN.1*" }}]'
    denominatorFilter='{ "country": "USA"}'
    granularity="month"
    smoothingWindow="0"
    views='["bar", "line", "bubble", "table"]'
    confidenceIntervalMethods='["wilson"]'
    width="100%"
    height="700px"
    lapisDateField="date"
    pageSize="10"
    yAxisMaxLinear="1"
    yAxisMaxLogarithmic="limitTo1"    
></gs-prevalence-over-time>`;

const meta: Meta<Required<PrevalenceOverTimeProps>> = {
    title: 'Visualization/Prevalence over time',
    component: 'gs-prevalence-over-time',
    argTypes: {
        granularity: {
            options: ['day', 'week', 'month', 'year'],
            control: { type: 'radio' },
        },
        smoothingWindow: { control: 'number' },
        views: {
            options: ['bar', 'line', 'bubble', 'table'],
            control: { type: 'check' },
        },
        confidenceIntervalMethods: {
            options: ['none', 'wilson'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        pageSize: { control: 'object' },
        yAxisMaxLinear: { control: 'object' },
        yAxisMaxLogarithmic: { control: 'object' },
    },
    parameters: withComponentDocs({
        componentDocs: {
            opensShadowDom: true,
            expectsChildren: false,
            codeExample,
        },
    }),
    tags: ['autodocs'],
};

export default meta;

const Template: StoryObj<Required<PrevalenceOverTimeProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-prevalence-over-time
                .numeratorFilters=${args.numeratorFilters}
                .denominatorFilter=${args.denominatorFilter}
                .granularity=${args.granularity}
                .smoothingWindow=${args.smoothingWindow}
                .views=${args.views}
                .confidenceIntervalMethods=${args.confidenceIntervalMethods}
                .width=${args.width}
                .height=${args.height}
                .lapisDateField=${args.lapisDateField}
                .pageSize=${args.pageSize}
                .yAxisMaxLinear=${args.yAxisMaxLinear}
                .yAxisMaxLogarithmic=${args.yAxisMaxLogarithmic}
            ></gs-prevalence-over-time>
        </gs-app>
    `,
};

export const TwoDatasets: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...Template,
    args: {
        numeratorFilters: [
            { displayName: 'EG', lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateFrom: '2023-01-01' } },
            { displayName: 'JN.1', lapisFilter: { country: 'USA', pangoLineage: 'JN.1*', dateFrom: '2023-01-01' } },
        ],
        denominatorFilter: { country: 'USA', dateFrom: '2023-01-01' },
        granularity: 'month',
        smoothingWindow: 0,
        views: ['bar', 'line', 'bubble', 'table'],
        confidenceIntervalMethods: ['wilson'],
        width: '100%',
        lapisDateField: 'date',
        pageSize: 10,
        yAxisMaxLinear: 1,
        yAxisMaxLogarithmic: 'limitTo1',
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'numeratorEG',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            pangoLineage: 'EG*',
                            dateFrom: '2023-01-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: numeratorFilterEG,
                    },
                },
                {
                    matcher: {
                        name: 'numeratorJN1',
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
                        body: numeratorFilterJN1,
                    },
                },
                {
                    matcher: {
                        name: 'denominator',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            dateFrom: '2023-01-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: denominatorFilter,
                    },
                },
            ],
        },
    },
};

export const OneDataset: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...Template,
    args: {
        numeratorFilters: [
            {
                displayName: 'EG',
                lapisFilter: { country: 'USA', pangoLineage: 'BA.2.86*', dateFrom: '2023-10-01' },
            },
        ],
        denominatorFilter: { country: 'USA', dateFrom: '2023-10-01' },
        granularity: 'week',
        smoothingWindow: 2,
        views: ['bar', 'line', 'bubble', 'table'],
        confidenceIntervalMethods: ['wilson'],
        width: '100%',
        lapisDateField: 'date',
        pageSize: 10,
        yAxisMaxLinear: 1,
        yAxisMaxLogarithmic: 'limitTo1',
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'numeratorOneDataset',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            pangoLineage: 'BA.2.86*',
                            dateFrom: '2023-10-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: numeratorFilterOneDataset,
                    },
                },
                {
                    matcher: {
                        name: 'denominatorOneDataset',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            country: 'USA',
                            dateFrom: '2023-10-01',
                            fields: ['date'],
                        },
                    },
                    response: {
                        status: 200,
                        body: denominatorFilterOneDataset,
                    },
                },
            ],
        },
    },
};

export const OneDatasetOnLineTab: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Line' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Line' }));
    },
};

export const OneDatasetOnBubbleTab: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Bubble' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Bubble' }));
    },
};

export const OneDatasetOnTableTab: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Table' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Table' }));
    },
};

export const WithFixedHeight: StoryObj<Required<PrevalenceOverTimeProps>> = {
    ...TwoDatasets,
    args: {
        ...TwoDatasets.args,
        height: '700px',
    },
};

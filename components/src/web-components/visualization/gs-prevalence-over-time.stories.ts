import { expect, fireEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../app';
import './gs-prevalence-over-time';
// eslint-disable-next-line no-duplicate-imports
import { type PrevalenceOverTimeComponentProps } from './gs-prevalence-over-time';
import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import denominatorFilter from '../../preact/prevalenceOverTime/__mockData__/denominatorFilter.json';
import denominatorFilterOneDataset from '../../preact/prevalenceOverTime/__mockData__/denominatorFilterOneDataset.json';
import numeratorFilterEG from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterEG.json';
import numeratorFilterJN1 from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterJN1.json';
import numeratorFilterOneDataset from '../../preact/prevalenceOverTime/__mockData__/numeratorFilterOneDataset.json';
import { withinShadowRoot } from '../withinShadowRoot.story';

const codeExample = String.raw`
<gs-prevalence-over-time
    numeratorFilter='[{ "displayName": "EG", "lapisFilter": { "country": "USA", "pangoLineage": "EG*" }}, { "displayName": "JN.1", "lapisFilter": { "country": "USA", "pangoLineage": "JN.1*" }}]'
    denominatorFilter='{ "country": "USA"}'
    granularity="month"
    smoothingWindow="0"
    views='["bar", "line", "bubble", "table"]'
    confidenceIntervalMethods='["wilson"]'
    headline="Prevalence over time"
    width="100%"
    height="700px"
    lapisDateField="date"
    pageSize="10"
    yAxisMaxLinear="1"
    yAxisMaxLogarithmic="limitTo1"    
></gs-prevalence-over-time>`;

const meta: Meta<Required<PrevalenceOverTimeComponentProps>> = {
    title: 'Visualization/Prevalence over time',
    component: 'gs-prevalence-over-time',
    argTypes: {
        numeratorFilter: { control: 'object' },
        denominatorFilter: { control: 'object' },
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
            options: ['wilson'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        headline: { control: 'text' },
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

const Template: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-prevalence-over-time
                .numeratorFilter=${args.numeratorFilter}
                .denominatorFilter=${args.denominatorFilter}
                .granularity=${args.granularity}
                .smoothingWindow=${args.smoothingWindow}
                .views=${args.views}
                .confidenceIntervalMethods=${args.confidenceIntervalMethods}
                .width=${args.width}
                .height=${args.height}
                .headline=${args.headline}
                .lapisDateField=${args.lapisDateField}
                .pageSize=${args.pageSize}
                .yAxisMaxLinear=${args.yAxisMaxLinear}
                .yAxisMaxLogarithmic=${args.yAxisMaxLogarithmic}
            ></gs-prevalence-over-time>
        </gs-app>
    `,
};

export const TwoDatasets: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    ...Template,
    args: {
        numeratorFilter: [
            { displayName: 'EG', lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateFrom: '2023-01-01' } },
            { displayName: 'JN.1', lapisFilter: { country: 'USA', pangoLineage: 'JN.1*', dateFrom: '2023-01-01' } },
        ],
        denominatorFilter: { country: 'USA', dateFrom: '2023-01-01' },
        granularity: 'month',
        smoothingWindow: 0,
        views: ['bar', 'line', 'bubble', 'table'],
        confidenceIntervalMethods: ['wilson'],
        width: '100%',
        height: '700px',
        headline: 'Prevalence over time',
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

export const OneDataset: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    ...Template,
    args: {
        numeratorFilter: {
            displayName: 'EG',
            lapisFilter: { country: 'USA', pangoLineage: 'BA.2.86*', dateFrom: '2023-10-01' },
        },
        denominatorFilter: { country: 'USA', dateFrom: '2023-10-01' },
        granularity: 'week',
        smoothingWindow: 2,
        views: ['bar', 'line', 'bubble', 'table'],
        confidenceIntervalMethods: ['wilson'],
        width: '100%',
        height: '700px',
        headline: 'Prevalence over time',
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

export const OneDatasetOnLineTab: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Line' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Line' }));
    },
};

export const OneDatasetOnBubbleTab: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Bubble' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Bubble' }));
    },
};

export const OneDatasetOnTableTab: StoryObj<Required<PrevalenceOverTimeComponentProps>> = {
    ...OneDataset,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-prevalence-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Table' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Table' }));
    },
};

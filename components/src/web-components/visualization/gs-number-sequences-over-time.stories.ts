import { expect, fireEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '../app';
import './gs-number-sequences-over-time';
import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import oneVariantEG from '../../preact/numberSequencesOverTime/__mockData__/oneVariantEG.json';
import twoVariantsEG from '../../preact/numberSequencesOverTime/__mockData__/twoVariantsEG.json';
import twoVariantsJN1 from '../../preact/numberSequencesOverTime/__mockData__/twoVariantsJN1.json';
import type { NumberSequencesOverTimeProps } from '../../preact/numberSequencesOverTime/number-sequences-over-time';
import { withinShadowRoot } from '../withinShadowRoot.story';

const codeExample = String.raw`
<gs-number-sequences-over-time
    lapisFilter='[{ "displayName": "EG", "lapisFilter": { "country": "USA", "pangoLineage": "EG*" }}, { "displayName": "JN.1", "lapisFilter": { "country": "USA", "pangoLineage": "JN.1*" }}]'
    lapisDateField="date"
    views='["bar", "line", "table"]'
    headline="Number of sequences over time"
    width="100%"
    height="700px"
    granularity="month"
    smoothingWindow="0"
    pageSize="10"
></gs-number-sequences-over-time>`;

const meta: Meta<NumberSequencesOverTimeProps> = {
    title: 'Visualization/Number sequences over time',
    component: 'gs-number-sequences-over-time',
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

const Template: StoryObj<NumberSequencesOverTimeProps> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-number-sequences-over-time
                .lapisFilter=${args.lapisFilter}
                .lapisDateField=${args.lapisDateField}
                .views=${args.views}
                .width=${args.width}
                .height=${args.height}
                .headline=${args.headline}
                .granularity=${args.granularity}
                .smoothingWindow=${args.smoothingWindow}
                .pageSize=${args.pageSize}
            ></gs-number-sequences-over-time>
        </gs-app>
    `,
    args: {
        views: ['bar', 'line', 'table'],
        lapisFilter: [
            { displayName: 'EG', lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateFrom: '2022-12-01' } },
        ],
        lapisDateField: 'date',
        width: '100%',
        height: '700px',
        headline: 'Number of sequences over time',
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

export const OneDatasetTable: StoryObj<NumberSequencesOverTimeProps> = {
    ...Template,
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-number-sequences-over-time');

        await waitFor(() => expect(canvas.getByRole('button', { name: 'Table' })).toBeInTheDocument());

        await fireEvent.click(canvas.getByRole('button', { name: 'Table' }));
    },
};

export const TwoDatasets: StoryObj<NumberSequencesOverTimeProps> = {
    ...Template,
    args: {
        ...Template.args,
        lapisFilter: [
            {
                displayName: 'EG until 2023-06',
                lapisFilter: { country: 'USA', pangoLineage: 'EG*', dateTo: '2023-06-30' },
            },
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

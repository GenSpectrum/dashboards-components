import { type Meta, type StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import aggregatedData from '../../preact/aggregatedData/__mockData__/aggregated.json';
import aggregatedDataWith1Field from '../../preact/aggregatedData/__mockData__/aggregatedWith1Field.json';
import aggregatedDataWith2Fields from '../../preact/aggregatedData/__mockData__/aggregatedWith2Fields.json';
import type { AggregateProps } from '../../preact/aggregatedData/aggregate';

import './gs-aggregate';
import '../gs-app';

const codeExample = `
<gs-aggregate 
    fields='["division", "host"]'
    lapisFilter='{"country": "USA"}'
    views='["table"]'
    width='100%'
    height='700px'
    initialSortField="count"
    initialSortDirection="descending"
    pageSize="10"
    maxNumberOfBars="50"
></gs-aggregate>`;

const meta: Meta<Required<AggregateProps>> = {
    title: 'Visualization/Aggregate',
    component: 'gs-aggregate',
    argTypes: {
        fields: [{ control: 'object' }],
        views: {
            options: ['table', 'bar'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        pageSize: { control: 'object' },
        initialSortField: { control: 'text' },
        initialSortDirection: {
            options: ['ascending', 'descending'],
            control: { type: 'radio' },
        },
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

export const Default: StoryObj<Required<AggregateProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-aggregate
                .fields=${args.fields}
                .lapisFilter=${args.lapisFilter}
                .views=${args.views}
                .width=${args.width}
                .height=${args.height}
                .initialSortField=${args.initialSortField}
                .initialSortDirection=${args.initialSortDirection}
                .pageSize=${args.pageSize}
                .maxNumberOfBars=${args.maxNumberOfBars}
            ></gs-aggregate>
        </gs-app>
    `,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregatedData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: ['division', 'host'],
                            country: 'USA',
                        },
                    },
                    response: {
                        status: 200,
                        body: aggregatedData,
                    },
                },
            ],
        },
    },
    args: {
        fields: ['division', 'host'],
        views: ['table', 'bar'],
        lapisFilter: {
            country: 'USA',
        },
        width: '100%',
        initialSortField: 'count',
        initialSortDirection: 'descending',
        pageSize: 10,
        maxNumberOfBars: 10,
    },
};

export const WithFixedHeight: StoryObj<Required<AggregateProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-aggregate
                .fields=${args.fields}
                .lapisFilter=${args.lapisFilter}
                .views=${args.views}
                .width=${args.width}
                .height=${args.height}
                .initialSortField=${args.initialSortField}
                .initialSortDirection=${args.initialSortDirection}
                .pageSize=${args.pageSize}
                .maxNumberOfBars=${args.maxNumberOfBars}
            ></gs-aggregate>
        </gs-app>
    `,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregatedData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: ['division', 'host'],
                            country: 'USA',
                        },
                    },
                    response: {
                        status: 200,
                        body: aggregatedData,
                    },
                },
            ],
        },
    },
    args: {
        ...Default.args,
        height: '700px',
    },
};

export const BarChartWithOneField: StoryObj<Required<AggregateProps>> = {
    ...Default,
    args: {
        ...Default.args,
        fields: ['division'],
        views: ['bar', 'table'],
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregatedData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: ['division'],
                            country: 'USA',
                        },
                    },
                    response: {
                        status: 200,
                        body: aggregatedDataWith1Field,
                    },
                },
            ],
        },
    },
};

export const BarChartWithTwoFields: StoryObj<Required<AggregateProps>> = {
    ...Default,
    args: {
        ...Default.args,
        fields: ['division', 'nextstrainClade'],
        lapisFilter: {
            country: 'Germany',
            dateTo: '2022-02-01',
        },
        views: ['bar', 'table'],
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'aggregatedData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: ['division', 'nextstrainClade'],
                            country: 'Germany',
                            dateTo: '2022-02-01',
                        },
                    },
                    response: {
                        status: 200,
                        body: aggregatedDataWith2Fields,
                    },
                },
            ],
        },
    },
};

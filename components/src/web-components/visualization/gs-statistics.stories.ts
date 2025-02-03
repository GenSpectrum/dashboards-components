import { type Meta, type StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import denominatorData from '../../preact/statistic/__mockData__/denominator.json';
import numeratorData from '../../preact/statistic/__mockData__/numerator.json';
import { type StatisticsProps } from '../../preact/statistic/statistics';

import './gs-statistics';
import '../gs-app';

const codeExample = `
<gs-statistics
    numeratorFilter='{"country": "USA", "division": "Alabama}'
    denominatorFilter='{"country": "USA"}' 
    width='100%'
    height='700px'
></gs-statistics>`;

const meta: Meta<Required<StatisticsProps>> = {
    title: 'Visualization/Statistics',
    component: 'gs-statistics',
    argTypes: {
        width: { control: 'text' },
        height: { control: 'text' },
    },
    parameters: withComponentDocs({
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'denominatorData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: [],
                            country: 'USA',
                        },
                    },
                    response: {
                        status: 200,
                        body: denominatorData,
                    },
                },
                {
                    matcher: {
                        name: 'numeratorData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: [],
                            country: 'USA',
                            division: 'Alabama',
                        },
                    },
                    response: {
                        status: 200,
                        body: numeratorData,
                    },
                },
            ],
        },
        componentDocs: {
            opensShadowDom: true,
            expectsChildren: false,
            codeExample,
        },
    }),
    tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj<Required<StatisticsProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-statistics
                .numeratorFilter=${args.numeratorFilter}
                .denominatorFilter=${args.denominatorFilter}
                .width=${args.width}
                .height=${args.height}
            ></gs-statistics>
        </gs-app>
    `,
    args: {
        denominatorFilter: {
            country: 'USA',
        },
        numeratorFilter: {
            country: 'USA',
            division: 'Alabama',
        },
        width: '100%',
    },
};

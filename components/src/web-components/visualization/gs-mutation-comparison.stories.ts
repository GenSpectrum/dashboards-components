import { expect, fireEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import './gs-mutation-comparison';
import '../gs-app';
import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { LAPIS_URL, NUCLEOTIDE_MUTATIONS_ENDPOINT } from '../../constants';
import nucleotideMutationsOtherDataset from '../../preact/mutationComparison/__mockData__/nucleotideMutationsOtherDataset.json';
import nucleotideMutationsSomeDataset from '../../preact/mutationComparison/__mockData__/nucleotideMutationsSomeDataset.json';
import { type MutationComparisonProps } from '../../preact/mutationComparison/mutation-comparison';
import { withinShadowRoot } from '../withinShadowRoot.story';

const codeExample = String.raw`
<gs-mutation-comparison
    lapisFilters='[{ "displayName": "Data in Switzerland", "lapisFilter": { "country": "Switzerland" }}, { "displayName": "Data in Germany", "lapisFilter": { "country": "Germany" }}]'
    sequenceType="nucleotide"
    views='["table", "venn"]'
    width='100%'
    height='700px'
    pageSize="10"
></gs-mutation-comparison>`;

const meta: Meta<Required<MutationComparisonProps>> = {
    title: 'Visualization/Mutation comparison',
    component: 'gs-mutation-comparison',
    argTypes: {
        lapisFilters: { control: 'object' },
        sequenceType: {
            options: ['nucleotide', 'amino acid'],
            control: { type: 'radio' },
        },
        views: {
            options: ['table', 'venn'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
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

const Template: StoryObj<Required<MutationComparisonProps>> = {
    render: (args) => html`
        <gs-app lapis="${LAPIS_URL}">
            <gs-mutation-comparison
                .lapisFilters=${args.lapisFilters}
                .sequenceType=${args.sequenceType}
                .views=${args.views}
                .width=${args.width}
                .height=${args.height}
                .pageSize=${args.pageSize}
            ></gs-mutation-comparison>
        </gs-app>
    `,
};

const dateTo = '2022-01-01';
const dateFrom = '2021-01-01';

export const Default: StoryObj<Required<MutationComparisonProps>> = {
    ...Template,
    args: {
        lapisFilters: [
            {
                displayName: 'Some dataset',
                lapisFilter: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo },
            },
            {
                displayName: 'Other dataset',
                lapisFilter: {
                    country: 'Switzerland',
                    pangoLineage: 'B.1.1.7',
                    dateFrom,
                    dateTo,
                },
            },
        ],
        sequenceType: 'nucleotide',
        views: ['table', 'venn'],
        width: '100%',
        pageSize: 10,
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'nucleotideMutationsSomeDataset',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateTo,
                            minProportion: 0,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideMutationsSomeDataset,
                    },
                },
                {
                    matcher: {
                        name: 'nucleotideMutationsOtherDataset',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom,
                            dateTo,
                            minProportion: 0,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideMutationsOtherDataset,
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-mutation-comparison');

        await step('Min and max proportions should be 50% and 100%', async () => {
            const minInput = () => canvas.getAllByLabelText('%')[0];
            const maxInput = () => canvas.getAllByLabelText('%')[1];

            await waitFor(() => expect(minInput()).toHaveValue(50));
            await waitFor(() => expect(maxInput()).toHaveValue(100));
        });
    },
};

export const VennDiagram: StoryObj<Required<MutationComparisonProps>> = {
    ...Default,
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-mutation-comparison');

        await step('Switch to Venn diagram view', async () => {
            await waitFor(() => expect(canvas.getByRole('button', { name: 'Venn' })).toBeInTheDocument());

            await fireEvent.click(canvas.getByRole('button', { name: 'Venn' }));

            await waitFor(() =>
                expect(
                    canvas.getByText('You have no elements selected. Click in the venn diagram to select.'),
                ).toBeVisible(),
            );
        });
    },
};

export const WithFixedHeight: StoryObj<Required<MutationComparisonProps>> = {
    ...Default,
    args: {
        ...Default.args,
        height: '700px',
    },
};

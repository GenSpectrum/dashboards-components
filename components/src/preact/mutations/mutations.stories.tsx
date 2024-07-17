import { type Meta, type StoryObj } from '@storybook/preact';
import { expect, waitFor, within } from '@storybook/test';

import nucleotideInsertions from './__mockData__/nucleotideInsertions.json';
import nucleotideMutations from './__mockData__/nucleotideMutations.json';
import { Mutations, type MutationsProps } from './mutations';
import { LAPIS_URL, NUCLEOTIDE_INSERTIONS_ENDPOINT, NUCLEOTIDE_MUTATIONS_ENDPOINT } from '../../constants';
import referenceGenome from '../../lapisApi/__mockData__/referenceGenome.json';
import { LapisUrlContext } from '../LapisUrlContext';
import { ReferenceGenomeContext } from '../ReferenceGenomeContext';

const meta: Meta<MutationsProps> = {
    title: 'Visualization/Mutations',
    component: Mutations,
    argTypes: {
        lapisFilter: { control: 'object' },
        sequenceType: {
            options: ['nucleotide', 'amino acid'],
            control: { type: 'radio' },
        },
        views: {
            options: ['table', 'grid', 'insertions'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        pageSize: { control: 'object' },
    },
};

export default meta;

const Template = {
    render: (args: MutationsProps) => (
        <LapisUrlContext.Provider value={LAPIS_URL}>
            <ReferenceGenomeContext.Provider value={referenceGenome}>
                <Mutations
                    lapisFilter={args.lapisFilter}
                    sequenceType={args.sequenceType}
                    views={args.views}
                    width={args.width}
                    height={args.height}
                    pageSize={args.pageSize}
                />
            </ReferenceGenomeContext.Provider>
        </LapisUrlContext.Provider>
    ),
};

export const Default: StoryObj<MutationsProps> = {
    ...Template,
    args: {
        lapisFilter: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo: '2022-01-01' },
        sequenceType: 'nucleotide',
        views: ['grid', 'table', 'insertions'],
        width: '100%',
        height: '700px',
        pageSize: 10,
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'nucleotideMutations',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateTo: '2022-01-01',
                            minProportion: 0,
                        },
                    },
                    response: {
                        status: 200,
                        body: nucleotideMutations,
                    },
                },
                {
                    matcher: {
                        name: 'nucleotideInsertions',
                        url: NUCLEOTIDE_INSERTIONS_ENDPOINT,
                        body: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo: '2022-01-01' },
                    },
                    response: {
                        status: 200,
                        body: nucleotideInsertions,
                    },
                },
            ],
        },
    },
};

export const GridTab: StoryObj<MutationsProps> = {
    ...Default,
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        const mutationAboveThreshold = () => canvas.getAllByText('51.03%');
        const mutationBelowThreshold = () => canvas.getAllByText('3.51%');

        await step('All proportions are displayed, when one is above threshold', async () => {
            await waitFor(() => expect(mutationAboveThreshold()[0]).toBeVisible());
            await waitFor(() => expect(mutationBelowThreshold()[0]).toBeVisible());
        });
    },
};

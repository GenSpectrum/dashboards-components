import { type Meta, type StoryObj } from '@storybook/preact';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import nucleotideMutationsOtherDataset from './__mockData__/nucleotideMutationsOtherDataset.json';
import nucleotideMutationsSomeDataset from './__mockData__/nucleotideMutationsSomeDataset.json';
import { MutationComparison, type MutationComparisonProps } from './mutation-comparison';
import { LAPIS_URL, NUCLEOTIDE_MUTATIONS_ENDPOINT } from '../../constants';
import referenceGenome from '../../lapisApi/__mockData__/referenceGenome.json';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import { ReferenceGenomeContext } from '../ReferenceGenomeContext';

const dateToSomeDataset = '2022-01-01';

const dateFromOtherDataset = '2021-01-01';
const dateToOtherDataset = '2022-01-02';

const meta: Meta<MutationComparisonProps> = {
    title: 'Visualization/Mutation comparison',
    component: MutationComparison,
    argTypes: {
        lapisFilters: [{ control: 'object' }],
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
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'nucleotideMutationsSomeVariant',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateTo: dateToSomeDataset,
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
                        name: 'nucleotideMutationsOtherVariant',
                        url: NUCLEOTIDE_MUTATIONS_ENDPOINT,
                        body: {
                            country: 'Switzerland',
                            pangoLineage: 'B.1.1.7',
                            dateFrom: dateFromOtherDataset,
                            dateTo: dateToOtherDataset,
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
};

export default meta;

const Template: StoryObj<MutationComparisonProps> = {
    render: (args) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <ReferenceGenomeContext.Provider value={referenceGenome}>
                <MutationComparison
                    lapisFilters={args.lapisFilters}
                    sequenceType={args.sequenceType}
                    views={args.views}
                    width={args.width}
                    height={args.height}
                    pageSize={args.pageSize}
                />
            </ReferenceGenomeContext.Provider>
        </LapisUrlContextProvider>
    ),
};

export const TwoVariants: StoryObj<MutationComparisonProps> = {
    ...Template,
    args: {
        lapisFilters: [
            {
                displayName: 'Some dataset',
                lapisFilter: { country: 'Switzerland', pangoLineage: 'B.1.1.7', dateTo: dateToSomeDataset },
            },
            {
                displayName: 'Other dataset',
                lapisFilter: {
                    country: 'Switzerland',
                    pangoLineage: 'B.1.1.7',
                    dateFrom: dateFromOtherDataset,
                    dateTo: dateToOtherDataset,
                },
            },
        ],
        sequenceType: 'nucleotide',
        views: ['table', 'venn'],
        width: '100%',
        pageSize: 10,
    },
};

export const FilterForOnlyDeletions: StoryObj<MutationComparisonProps> = {
    ...TwoVariants,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const someSubstitution = () => canvas.queryByText('C241T');
        const someDeletion = () => canvas.queryByText('G199-');

        await waitFor(() => expect(someSubstitution()).toBeVisible());
        await waitFor(() => expect(someDeletion()).toBeVisible());

        canvas.getByRole('button', { name: 'Subst., Del.' }).click();
        canvas.getByLabelText('Substitutions').click();

        await waitFor(() => expect(someSubstitution()).not.toBeInTheDocument());
        await waitFor(() => expect(someDeletion()).toBeVisible());
    },
};

export const FilterByProportion: StoryObj<MutationComparisonProps> = {
    ...TwoVariants,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const rareSubstitution = () => canvas.queryByText('T1234C');
        const frequentSubstitution = () => canvas.queryByText('C241T');
        const minInput = () => canvas.getAllByLabelText('%')[0];
        const maxInput = () => canvas.getAllByLabelText('%')[1];

        await waitFor(() => expect(rareSubstitution()).not.toBeInTheDocument());
        await waitFor(() => expect(frequentSubstitution()).toBeVisible());

        await userEvent.click(canvas.getByRole('button', { name: /Proportion/ }));
        await userEvent.clear(minInput());
        await userEvent.type(minInput(), '1');

        await waitFor(() => expect(rareSubstitution()).toBeInTheDocument());
        await waitFor(() => expect(frequentSubstitution()).toBeVisible());

        await userEvent.clear(maxInput());
        await userEvent.type(maxInput(), '50');

        await waitFor(() => expect(rareSubstitution()).toBeInTheDocument());
        await waitFor(() => expect(frequentSubstitution()).not.toBeInTheDocument());
    },
};

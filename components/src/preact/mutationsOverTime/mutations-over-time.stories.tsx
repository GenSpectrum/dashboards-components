import { type Meta, type StoryObj } from '@storybook/preact';
import { expect, userEvent, waitFor } from '@storybook/test';

import { MutationsOverTime, type MutationsOverTimeProps } from './mutations-over-time';
import { LAPIS_URL } from '../../constants';
import referenceGenome from '../../lapisApi/__mockData__/referenceGenome.json';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import { ReferenceGenomeContext } from '../ReferenceGenomeContext';
import { expectInvalidAttributesErrorMessage } from '../shared/stories/expectErrorMessage';

const meta: Meta<MutationsOverTimeProps> = {
    title: 'Visualization/Mutation over time',
    component: MutationsOverTime,
    argTypes: {
        lapisFilter: { control: 'object' },
        sequenceType: {
            options: ['nucleotide', 'amino acid'],
            control: { type: 'radio' },
        },
        views: {
            options: ['grid'],
            control: { type: 'check' },
        },
        width: { control: 'text' },
        height: { control: 'text' },
        granularity: {
            options: ['day', 'week', 'month', 'year'],
            control: { type: 'radio' },
        },
        lapisDateField: { control: 'text' },
    },
    parameters: {
        fetchMock: {},
    },
};

export default meta;

const Template = {
    render: (args: MutationsOverTimeProps) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <ReferenceGenomeContext.Provider value={referenceGenome}>
                <MutationsOverTime
                    lapisFilter={args.lapisFilter}
                    sequenceType={args.sequenceType}
                    views={args.views}
                    width={args.width}
                    height={args.height}
                    granularity={args.granularity}
                    lapisDateField={args.lapisDateField}
                />
            </ReferenceGenomeContext.Provider>
        </LapisUrlContextProvider>
    ),
};

// This test uses mock data: defaultMockData.ts (through mutationOverTimeWorker.mock.ts)
export const Default: StoryObj<MutationsOverTimeProps> = {
    ...Template,
    args: {
        lapisFilter: { pangoLineage: 'JN.1*', dateFrom: '2024-01-15', dateTo: '2024-07-10' },
        sequenceType: 'nucleotide',
        views: ['grid'],
        width: '100%',
        granularity: 'month',
        lapisDateField: 'date',
    },
};

// This test uses mock data: showMessagWhenTooManyMutations.ts (through mutationOverTimeWorker.mock.ts)
export const ShowsMessageWhenTooManyMutations: StoryObj<MutationsOverTimeProps> = {
    ...Template,
    args: {
        lapisFilter: { dateFrom: '2023-01-01', dateTo: '2023-12-31' },
        sequenceType: 'nucleotide',
        views: ['grid'],
        width: '100%',
        granularity: 'year',
        lapisDateField: 'date',
    },
    play: async ({ canvas }) => {
        await waitFor(() => expect(canvas.getByText('Showing 100 of 137 mutations.', { exact: false })).toBeVisible(), {
            timeout: 10000,
        });
    },
};

export const ShowsNoDataWhenNoMutationsAreInFilter: StoryObj<MutationsOverTimeProps> = {
    ...Template,
    args: {
        lapisFilter: { dateFrom: '1800-01-01', dateTo: '1800-01-02' },
        sequenceType: 'nucleotide',
        views: ['grid'],
        width: '100%',
        height: '700px',
        granularity: 'year',
        lapisDateField: 'date',
    },
    play: async ({ canvas }) => {
        await waitFor(() => expect(canvas.getByText('No data available.', { exact: false })).toBeVisible(), {
            timeout: 10000,
        });
    },
};

export const ShowsNoDataMessageWhenThereAreNoDatesInFilter: StoryObj<MutationsOverTimeProps> = {
    ...Template,
    args: {
        lapisFilter: { dateFrom: '2345-01-01', dateTo: '2020-01-02' },
        sequenceType: 'nucleotide',
        views: ['grid'],
        width: '100%',
        height: '700px',
        granularity: 'year',
        lapisDateField: 'date',
    },
    play: async ({ canvas }) => {
        await waitFor(() => expect(canvas.getByText('No data available.', { exact: false })).toBeVisible(), {
            timeout: 10000,
        });
    },
};

export const ShowsNoDataMessageForStrictFilters: StoryObj<MutationsOverTimeProps> = {
    ...Template,
    args: {
        lapisFilter: { pangoLineage: 'JN.1*', dateFrom: '2024-01-15', dateTo: '2024-07-10' },
        sequenceType: 'nucleotide',
        views: ['grid'],
        width: '100%',
        height: '700px',
        granularity: 'month',
        lapisDateField: 'date',
    },
    play: async ({ canvas }) => {
        await waitFor(() => expect(canvas.getByText('Grid')).toBeVisible(), { timeout: 10000 });

        const button = canvas.getByRole('button', { name: 'Mean proportion 5.0% - 90.0%' });
        await userEvent.click(button);

        const minInput = canvas.getAllByLabelText('%')[0];
        await userEvent.clear(minInput);
        await userEvent.type(minInput, '40');

        const maxInput = canvas.getAllByLabelText('%')[1];
        await userEvent.clear(maxInput);
        await userEvent.type(maxInput, '41');

        await waitFor(
            () => expect(canvas.getByText('No data available for your filters.', { exact: false })).toBeVisible(),
            {
                timeout: 10000,
            },
        );
    },
};

export const WithNoLapisDateFieldField: StoryObj<MutationsOverTimeProps> = {
    ...Default,
    args: {
        ...Default.args,
        lapisDateField: '',
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(canvasElement, 'String must contain at least 1 character(s)');
        });
    },
};

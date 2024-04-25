import { withActions } from '@storybook/addon-actions/decorator';
import { type Meta, type StoryObj } from '@storybook/preact';
import { expect, fireEvent, fn, userEvent, waitFor, within } from '@storybook/test';

import { MutationFilter, type MutationFilterProps } from './mutation-filter';
import { LAPIS_URL } from '../../constants';
import referenceGenome from '../../lapisApi/__mockData__/referenceGenome.json';
import { LapisUrlContext } from '../LapisUrlContext';
import { ReferenceGenomeContext } from '../ReferenceGenomeContext';

const meta: Meta<MutationFilterProps> = {
    title: 'Input/MutationFilter',
    component: MutationFilter,
    parameters: {
        actions: {
            handles: ['gs-mutation-filter-changed', 'gs-mutation-filter-on-blur'],
        },
        fetchMock: {},
    },
    decorators: [withActions],
};

export default meta;

export const Default: StoryObj<MutationFilterProps> = {
    render: () => (
        <LapisUrlContext.Provider value={LAPIS_URL}>
            <ReferenceGenomeContext.Provider value={referenceGenome}>
                <MutationFilter />
            </ReferenceGenomeContext.Provider>
        </LapisUrlContext.Provider>
    ),
};

export const FiresFilterChangedEvents: StoryObj<MutationFilterProps> = {
    ...Default,
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);
        const listenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-mutation-filter-changed', listenerMock);
        });

        await step('wait until data is loaded', async () => {
            await waitFor(() => {
                return expect(inputField(canvas)).toBeEnabled();
            });
        });

        await step('Enters an invalid mutation', async () => {
            await submitMutation(canvas, 'notAMutation');
            await expect(listenerMock).not.toHaveBeenCalled();

            await userEvent.type(inputField(canvas), '{backspace>12/}');
        });

        await step('Enter a valid mutation', async () => {
            await submitMutation(canvas, 'A123T');

            await waitFor(() =>
                expect(listenerMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        detail: {
                            nucleotideMutations: ['A123T'],
                            aminoAcidMutations: [],
                            nucleotideInsertions: [],
                            aminoAcidInsertions: [],
                        },
                    }),
                ),
            );
        });

        await step('Enter a second valid nucleotide mutation', async () => {
            await submitMutation(canvas, 'A234-');

            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        nucleotideMutations: ['A123T', 'A234-'],
                        aminoAcidMutations: [],
                        nucleotideInsertions: [],
                        aminoAcidInsertions: [],
                    },
                }),
            );
        });

        await step('Enter another valid mutation', async () => {
            await submitMutation(canvas, 'ins_123:AA');

            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        nucleotideMutations: ['A123T', 'A234-'],
                        aminoAcidMutations: [],
                        nucleotideInsertions: ['ins_123:AA'],
                        aminoAcidInsertions: [],
                    },
                }),
            );
        });

        await step('Remove the first mutation', async () => {
            const firstMutationDeleteButton = canvas.getAllByRole('button')[0];
            await waitFor(() => fireEvent.click(firstMutationDeleteButton));

            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        nucleotideMutations: ['A234-'],
                        aminoAcidMutations: [],
                        nucleotideInsertions: ['ins_123:AA'],
                        aminoAcidInsertions: [],
                    },
                }),
            );
        });
    },
};

export const FiresFilterOnBlurEvent: StoryObj<MutationFilterProps> = {
    ...Default,
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        const listenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-mutation-filter-on-blur', listenerMock);
        });

        await step('wait until data is loaded', async () => {
            await waitFor(() => {
                return expect(inputField(canvas)).toBeEnabled();
            });
        });

        await step('Move outside of input', async () => {
            await submitMutation(canvas, 'A234T');
            await submitMutation(canvas, 'S:A123G');
            await submitMutation(canvas, 'ins_123:AAA');
            await submitMutation(canvas, 'ins_S:123:AAA');
            await userEvent.tab();

            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        nucleotideMutations: ['A234T'],
                        aminoAcidMutations: ['S:A123G'],
                        nucleotideInsertions: ['ins_123:AAA'],
                        aminoAcidInsertions: ['ins_S:123:AAA'],
                    },
                }),
            );
        });
    },
};

const submitMutation = async (canvas: ReturnType<typeof within>, mutation: string) => {
    await userEvent.type(inputField(canvas), mutation);
    await waitFor(() => submitButton(canvas).click());
};
const inputField = (canvas: ReturnType<typeof within>) =>
    canvas.getByPlaceholderText('Enter a mutation', { exact: false });
const submitButton = (canvas: ReturnType<typeof within>) => canvas.getByRole('button', { name: '+' });

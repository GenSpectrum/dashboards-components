import { expect, fn, userEvent, waitFor } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { previewHandles } from '../../../.storybook/preview';
import { LAPIS_URL, REFERENCE_GENOME_ENDPOINT } from '../../constants';
import '../app';
import { type MutationFilterProps } from '../../preact/mutationFilter/mutation-filter';
import { withinShadowRoot } from '../withinShadowRoot.story';
import './gs-mutation-filter';

const codeExample = String.raw`
<gs-mutation-filter 
    initialValue='["A123T"]'
    width='100%'
></gs-mutation-filter>`;

const meta: Meta<MutationFilterProps> = {
    title: 'Input/Mutation filter',
    component: 'gs-mutation-filter',
    parameters: withComponentDocs({
        actions: {
            handles: ['gs-mutation-filter-changed', 'gs-mutation-filter-on-blur', ...previewHandles],
        },
        fetchMock: {},
        componentDocs: {
            opensShadowDom: true,
            expectsChildren: false,
            codeExample,
        },
    }),
    argTypes: {
        initialValue: {
            control: {
                type: 'object',
            },
        },
        width: { control: 'text' },
    },
    tags: ['autodocs'],
};

export default meta;

const Template: StoryObj<MutationFilterProps> = {
    render: (args) => {
        return html` <gs-app lapis="${LAPIS_URL}">
            <div class="max-w-screen-lg">
                <gs-mutation-filter .initialValue=${args.initialValue} .width=${args.width}></gs-mutation-filter>
            </div>
        </gs-app>`;
    },
    args: {
        initialValue: [],
        width: '100%',
    },
};

export const Default: StoryObj<MutationFilterProps> = {
    ...Template,
    args: {
        initialValue: ['A123T'],
    },
};

export const FiresFilterChangedEvent: StoryObj<MutationFilterProps> = {
    ...Template,
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-mutation-filter');

        const inputField = () => canvas.getByPlaceholderText('Enter a mutation', { exact: false });
        const listenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-mutation-filter-changed', listenerMock);
        });

        await step('wait until data is loaded', async () => {
            await waitFor(() => {
                return expect(inputField()).toBeEnabled();
            });
        });

        await step('Enter a valid mutation', async () => {
            await userEvent.type(inputField(), 'A123T');
            const firstOption = await canvas.findByRole('option', { name: /.*\S.*/ });
            await userEvent.click(firstOption);

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
    },
};

export const FiresFilterOnBlurEvent: StoryObj<MutationFilterProps> = {
    ...Template,
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-mutation-filter');

        const inputField = () => canvas.getByPlaceholderText('Enter a mutation', { exact: false });
        const listenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-mutation-filter-on-blur', listenerMock);
        });

        await step('wait until data is loaded', async () => {
            await waitFor(() => {
                return expect(inputField()).toBeEnabled();
            });
        });

        await step('Move outside of input', async () => {
            await userEvent.type(inputField(), 'A123T');
            await userEvent.tab();

            await expect(listenerMock).toHaveBeenCalled();
        });
    },
};

export const MultiSegmentedReferenceGenomes: StoryObj<MutationFilterProps> = {
    ...Template,
    args: {
        initialValue: ['seg1:123T', 'gene2:56', 'ins_seg2:78:AAA'],
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'referenceGenome',
                        url: REFERENCE_GENOME_ENDPOINT,
                    },
                    response: {
                        status: 200,
                        body: {
                            nucleotideSequences: [
                                {
                                    name: 'seg1',
                                    sequence: 'dummy',
                                },
                                {
                                    name: 'seg2',
                                    sequence: 'dummy',
                                },
                            ],
                            genes: [
                                {
                                    name: 'gene1',
                                    sequence: 'dummy',
                                },
                                {
                                    name: 'gene2',
                                    sequence: 'dummy',
                                },
                            ],
                        },
                    },
                    options: {
                        overwriteRoutes: false,
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-mutation-filter');

        await waitFor(() => {
            expect(canvas.getByText('seg1:123T')).toBeVisible();
            expect(canvas.getByText('gene2:56')).toBeVisible();
            return expect(canvas.getByText('ins_seg2:78:AAA')).toBeVisible();
        });
    },
};

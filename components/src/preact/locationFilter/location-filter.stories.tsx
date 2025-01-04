import { type Meta, type PreactRenderer, type StoryObj } from '@storybook/preact';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import type { StepFunction } from '@storybook/types';

import data from './__mockData__/aggregated.json';
import { LocationFilter, type LocationFilterProps } from './location-filter';
import { previewHandles } from '../../../.storybook/preview';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import { LapisUrlContext } from '../LapisUrlContext';
import { expectInvalidAttributesErrorMessage } from '../shared/stories/expectErrorMessage';

const meta: Meta<LocationFilterProps> = {
    title: 'Input/LocationFilter',
    component: LocationFilter,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'numeratorEG',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: ['region', 'country', 'division', 'location'],
                        },
                    },
                    response: {
                        status: 200,
                        body: data,
                    },
                },
            ],
        },
        actions: {
            handles: ['gs-location-changed', ...previewHandles],
        },
    },
    args: {
        width: '100%',
        fields: ['region', 'country', 'division', 'location'],
        value: { region: 'Europe', country: null, division: null, location: null },
        placeholderText: 'Select a location',
    },
    argTypes: {
        fields: {
            control: {
                type: 'object',
            },
        },
        value: {
            control: {
                type: 'object',
            },
        },
        width: {
            control: {
                type: 'text',
            },
        },
        placeholderText: {
            control: {
                type: 'text',
            },
        },
    },
};

export default meta;

export const Primary: StoryObj<LocationFilterProps> = {
    render: (args) => (
        <LapisUrlContext.Provider value={LAPIS_URL}>
            <LocationFilter
                fields={args.fields}
                value={args.value}
                width={args.width}
                placeholderText={args.placeholderText}
            />
        </LapisUrlContext.Provider>
    ),
    play: async ({ canvasElement, step }) => {
        const { canvas, locationChangedListenerMock } = await prepare(canvasElement, step);

        step('change location filter value fires event', async () => {
            const input = await inputField(canvas);
            await userEvent.clear(input);
            await userEvent.type(input, 'Germany');
            await userEvent.click(canvas.getByRole('option', { name: 'Germany Europe / Germany' }));

            await expect(locationChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        country: 'Germany',
                        region: 'Europe',
                        division: null,
                        location: null,
                    },
                }),
            );
        });
    },
};

export const ClearSelection: StoryObj<LocationFilterProps> = {
    ...Primary,
    play: async ({ canvasElement, step }) => {
        const { canvas, locationChangedListenerMock } = await prepare(canvasElement, step);

        step('clear selection fires event with empty filter', async () => {
            const clearSelectionButton = await canvas.findByLabelText('clear selection');
            await userEvent.click(clearSelectionButton);

            await expect(locationChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        country: null,
                        region: null,
                        division: null,
                        location: null,
                    },
                }),
            );
        });
    },
};

export const OnBlurInput: StoryObj<LocationFilterProps> = {
    ...Primary,
    play: async ({ canvasElement, step }) => {
        const { canvas, locationChangedListenerMock } = await prepare(canvasElement, step);

        step('after cleared selection by hand and then blur fires event with empty filter', async () => {
            const input = await inputField(canvas);
            await userEvent.clear(input);
            await userEvent.click(canvas.getByLabelText('toggle menu'));

            await expect(locationChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        country: null,
                        region: null,
                        division: null,
                        location: null,
                    },
                }),
            );
        });
    },
};

const inputField = (canvas: ReturnType<typeof within>) => canvas.findByPlaceholderText('Enter a location');

async function prepare(canvasElement: HTMLElement, step: StepFunction<PreactRenderer, unknown>) {
    const canvas = within(canvasElement);

    const locationChangedListenerMock = fn();
    step('Setup event listener mock', () => {
        canvasElement.addEventListener('gs-location-changed', locationChangedListenerMock);
    });

    step('location filter is rendered with value', async () => {
        await waitFor(async () => {
            return expect(await inputField(canvas)).toHaveValue('Europe');
        });
    });

    return { canvas, locationChangedListenerMock };
}

export const WithNoFields: StoryObj<LocationFilterProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        fields: [],
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(canvasElement, 'Array must contain at least 1 element(s)');
        });
    },
};

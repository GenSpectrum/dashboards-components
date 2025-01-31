import { type Meta, type StoryObj } from '@storybook/preact';
import { expect, waitFor, within } from '@storybook/test';

import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import denominatorData from './__mockData__/denominator.json';
import numeratorData from './__mockData__/numerator.json';
import { Statistics, type StatisticsProps } from './statistics';

const meta: Meta<StatisticsProps> = {
    title: 'Visualization/Statistics',
    component: Statistics,
    argTypes: {
        width: { control: 'text' },
        height: { control: 'text' },
    },
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: {
                        name: 'denominatorData',
                        url: AGGREGATED_ENDPOINT,
                        body: {
                            fields: [],
                            country: 'USA',
                            division: 'Alabama',
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
                        },
                    },
                    response: {
                        status: 200,
                        body: numeratorData,
                    },
                },
            ],
        },
    },
};

export default meta;

export const Default: StoryObj<StatisticsProps> = {
    render: (args) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <Statistics {...args} />
        </LapisUrlContextProvider>
    ),
    args: {
        numeratorFilter: {
            country: 'USA',
        },
        denominatorFilter: {
            country: 'USA',
            division: 'Alabama',
        },
        width: '100%',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(async () => {
            await expect(canvas.getByText('1,234')).toBeInTheDocument();
            await expect(canvas.getByText('50.00%')).toBeInTheDocument();
        });
    },
};

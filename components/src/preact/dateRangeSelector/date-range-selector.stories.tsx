import { type Meta, type PreactRenderer, type StoryObj } from '@storybook/preact';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import type { StepFunction } from '@storybook/types';
import dayjs from 'dayjs/esm';
import { useEffect, useRef, useState } from 'preact/hooks';

import { DateRangeSelector, type DateRangeSelectorProps } from './date-range-selector';
import { previewHandles } from '../../../.storybook/preview';
import { LAPIS_URL } from '../../constants';
import { LapisUrlContextProvider } from '../LapisUrlContext';
import { dateRangeOptionPresets } from './dateRangeOption';
import { expectInvalidAttributesErrorMessage } from '../shared/stories/expectErrorMessage';

const earliestDate = '1970-01-01';

const customDateRange = {
    label: 'CustomDateRange',
    dateFrom: '2021-01-01',
    dateTo: '2021-12-31',
};

const meta: Meta<DateRangeSelectorProps> = {
    title: 'Input/DateRangeSelector',
    component: DateRangeSelector,
    parameters: {
        actions: {
            handles: ['gs-date-range-filter-changed', 'gs-date-range-option-changed', ...previewHandles],
        },
        fetchMock: {},
    },
    argTypes: {
        value: {
            control: {
                type: 'object',
            },
        },
        dateRangeOptions: {
            control: {
                type: 'object',
            },
        },
        earliestDate: {
            control: {
                type: 'text',
            },
        },
        width: {
            control: {
                type: 'text',
            },
        },
    },
    args: {
        dateRangeOptions: [dateRangeOptionPresets.lastMonth, dateRangeOptionPresets.allTimes, customDateRange],
        earliestDate,
        value: undefined,
        lapisDateField: 'aDateColumn',
        width: '100%',
    },
};

export default meta;

const Primary: StoryObj<DateRangeSelectorProps> = {
    render: (args) => (
        <LapisUrlContextProvider value={LAPIS_URL}>
            <DateRangeSelector {...args} />
        </LapisUrlContextProvider>
    ),
};

export const SetCorrectInitialValues: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        value: 'CustomDateRange',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('CustomDateRange');
            await expect(dateFromPicker(canvas)).toHaveValue('2021-01-01');
            await expect(dateToPicker(canvas)).toHaveValue('2021-12-31');
        });
    },
};

const initialDateFrom = '2000-01-01';

export const SetCorrectInitialDateFrom: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        value: { dateFrom: initialDateFrom },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('Custom');
            await expect(dateFromPicker(canvas)).toHaveValue(initialDateFrom);
            await expect(dateToPicker(canvas)).toHaveValue(dayjs().format('YYYY-MM-DD'));
        });
    },
};

const initialDateTo = '2000-01-01';

export const SetCorrectInitialDateTo: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        value: { dateTo: initialDateTo },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('Custom');
            await expect(dateFromPicker(canvas)).toHaveValue(earliestDate);
            await expect(dateToPicker(canvas)).toHaveValue(initialDateTo);
        });
    },
};

export const ChangingDateSetsOptionToCustom: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    play: async ({ canvasElement, step }) => {
        const { canvas, filterChangedListenerMock, optionChangedListenerMock } = await prepare(canvasElement, step);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('Last month');
        });

        await step('Change date to custom value', async () => {
            await userEvent.type(dateFromPicker(canvas), '{backspace>12}');
            await userEvent.type(dateFromPicker(canvas), '2000-01-01');
            await userEvent.click(dateToPicker(canvas));

            await waitFor(async () => {
                await expect(selectField(canvas)).toHaveValue('Custom');
            });

            await expect(filterChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        aDateColumnFrom: '2000-01-01',
                        aDateColumnTo: dayjs().format('YYYY-MM-DD'),
                    },
                }),
            );

            await expect(optionChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        dateFrom: '2000-01-01',
                        dateTo: dayjs().format('YYYY-MM-DD'),
                    },
                }),
            );
        });
    },
};

export const ChangingTheValueProgrammatically: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    render: (args) => {
        const StatefulWrapper = () => {
            const [value, setValue] = useState('Last month');
            const ref = useRef<HTMLDivElement>(null);

            useEffect(() => {
                ref.current?.addEventListener('gs-date-range-option-changed', (event) => {
                    setValue((event as CustomEvent).detail);
                });
            }, []);

            return (
                <div ref={ref}>
                    <LapisUrlContextProvider value={LAPIS_URL}>
                        <DateRangeSelector {...args} value={value} />
                    </LapisUrlContextProvider>
                    <button className='btn' onClick={() => setValue(customDateRange.label)}>
                        Set to Custom
                    </button>
                    <button className='btn' onClick={() => setValue(dateRangeOptionPresets.lastMonth.label)}>
                        Set to Last month
                    </button>
                </div>
            );
        };

        return <StatefulWrapper />;
    },
    play: async ({ canvasElement, step }) => {
        const { canvas, filterChangedListenerMock, optionChangedListenerMock } = await prepare(canvasElement, step);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('Last month');
        });

        await step('Change the value of the component programmatically', async () => {
            await userEvent.click(canvas.getByRole('button', { name: 'Set to Custom' }));
            await waitFor(async () => {
                await expect(selectField(canvas)).toHaveValue(customDateRange.label);
            });

            await userEvent.click(canvas.getByRole('button', { name: 'Set to Last month' }));
            await waitFor(async () => {
                await expect(selectField(canvas)).toHaveValue('Last month');
            });

            await expect(filterChangedListenerMock).toHaveBeenCalledTimes(0);
            await expect(optionChangedListenerMock).toHaveBeenCalledTimes(0);
        });

        await step('Changing the value from within the component is still possible', async () => {
            await userEvent.selectOptions(selectField(canvas), 'All times');
            await waitFor(async () => {
                await expect(selectField(canvas)).toHaveValue('All times');
            });
            await expect(filterChangedListenerMock).toHaveBeenCalledTimes(1);
            await expect(optionChangedListenerMock).toHaveBeenCalledTimes(1);
        });
    },
};

export const ChangingDateOption: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    play: async ({ canvasElement, step }) => {
        const { canvas, filterChangedListenerMock, optionChangedListenerMock } = await prepare(canvasElement, step);

        await waitFor(async () => {
            await expect(selectField(canvas)).toHaveValue('Custom');
        });

        await step('Change date to custom', async () => {
            await userEvent.selectOptions(selectField(canvas), 'CustomDateRange');

            await waitFor(async () => {
                await expect(selectField(canvas)).toHaveValue('CustomDateRange');
            });

            await expect(filterChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        aDateColumnFrom: customDateRange.dateFrom,
                        aDateColumnTo: customDateRange.dateTo,
                    },
                }),
            );

            await expect(optionChangedListenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: customDateRange.label,
                }),
            );
        });
    },
};

export const HandlesInvalidInitialDateFrom: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        value: { dateFrom: 'not a date' },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await waitFor(async () => {
            await expect(canvas.getByText('Oops! Something went wrong.')).toBeVisible();
        });
    },
};

export const WithNoDateColumn: StoryObj<DateRangeSelectorProps> = {
    ...Primary,
    args: {
        ...Primary.args,
        lapisDateField: '',
    },
    play: async ({ canvasElement, step }) => {
        step('expect error message', async () => {
            await expectInvalidAttributesErrorMessage(canvasElement, 'String must contain at least 1 character(s)');
        });
    },
};

async function prepare(canvasElement: HTMLElement, step: StepFunction<PreactRenderer, unknown>) {
    const canvas = within(canvasElement);

    const filterChangedListenerMock = fn();
    await step('Setup event listener mock', async () => {
        canvasElement.addEventListener('gs-date-range-filter-changed', filterChangedListenerMock);
    });

    const optionChangedListenerMock = fn();
    await step('Setup event listener mock', async () => {
        canvasElement.addEventListener('gs-date-range-option-changed', optionChangedListenerMock);
    });

    return { canvas, filterChangedListenerMock, optionChangedListenerMock };
}

const dateFromPicker = (canvas: ReturnType<typeof within>) => canvas.getByPlaceholderText('Date from');
const dateToPicker = (canvas: ReturnType<typeof within>) => canvas.getByPlaceholderText('Date to');
const selectField = (canvas: ReturnType<typeof within>) => canvas.getByRole('combobox');

import { expect, fn, userEvent, waitFor, type within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import { withComponentDocs } from '../../../.storybook/ComponentDocsBlock';
import { previewHandles } from '../../../.storybook/preview';
import { LAPIS_URL } from '../../constants';
import { type DateRangeSelectorProps } from '../../preact/dateRangeSelector/date-range-selector';
import './gs-date-range-selector';
import '../gs-app';
import { toYYYYMMDD } from '../../preact/dateRangeSelector/dateConversion';
import { dateRangeOptionPresets } from '../../preact/dateRangeSelector/dateRangeOption';
import { withinShadowRoot } from '../withinShadowRoot.story';

const codeExample = String.raw`
<gs-date-range-selector
    dateRangeOptions='[{ "label": "Year 2021", "dateFrom": "2021-01-01", "dateTo": "2021-12-31" }]'
    earliestDate="1970-01-01"
    valule="Year 2021"
    width="100%"
    lapisDateField="myDateColumn"
></gs-date-range-selector>`;

const customDateRange = { label: 'CustomDateRange', dateFrom: '2021-01-01', dateTo: '2021-12-31' };

const meta: Meta<Required<DateRangeSelectorProps>> = {
    title: 'Input/DateRangeSelector',
    component: 'gs-date-range-selector',
    parameters: withComponentDocs({
        actions: {
            handles: ['gs-date-range-filter-changed', 'gs-date-range-option-changed', ...previewHandles],
        },
        fetchMock: {},
        componentDocs: {
            opensShadowDom: true,
            expectsChildren: false,
            codeExample,
        },
    }),
    argTypes: {
        value: {
            control: {
                type: 'object',
            },
        },
        lapisDateField: { control: { type: 'text' } },
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
        dateRangeOptions: [
            dateRangeOptionPresets.lastMonth,
            dateRangeOptionPresets.last3Months,
            dateRangeOptionPresets.allTimes,
            customDateRange,
        ],
        earliestDate: '1970-01-01',
        value: dateRangeOptionPresets.lastMonth.label,
        lapisDateField: 'aDateColumn',
        width: '100%',
    },
    tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj<Required<DateRangeSelectorProps>> = {
    render: (args) =>
        html` <gs-app lapis="${LAPIS_URL}">
            <div class="max-w-screen-lg">
                <gs-date-range-selector
                    .dateRangeOptions=${args.dateRangeOptions}
                    .earliestDate=${args.earliestDate}
                    .value=${args.value}
                    .width=${args.width}
                    .lapisDateField=${args.lapisDateField}
                ></gs-date-range-selector>
            </div>
        </gs-app>`,
};

export const FiresEvents: StoryObj<Required<DateRangeSelectorProps>> = {
    ...Default,
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-date-range-selector');

        const filterChangedListenerMock = fn();
        const optionChangedListenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-date-range-filter-changed', filterChangedListenerMock);
            canvasElement.addEventListener('gs-date-range-option-changed', optionChangedListenerMock);
        });

        await step('Expect last 6 months to be selected', async () => {
            await expect(selectField(canvas)).toHaveValue('Last month');
            await waitFor(() => {
                expect(dateToPicker(canvas)).toHaveValue(toYYYYMMDD(new Date()));
            });
        });

        await step('Expect event to be fired when selecting a different value', async () => {
            await userEvent.selectOptions(selectField(canvas), 'CustomDateRange');
            await expect(dateToPicker(canvas)).toHaveValue(customDateRange.dateTo);

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

const dateToPicker = (canvas: ReturnType<typeof within>) => canvas.getByPlaceholderText('Date to');
const selectField = (canvas: ReturnType<typeof within>) => canvas.getByRole('combobox');

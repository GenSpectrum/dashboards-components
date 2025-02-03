import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import z from 'zod';

import { computeInitialValues } from './computeInitialValues';
import { toYYYYMMDD } from './dateConversion';
import {
    DateRangeOptionChangedEvent,
    dateRangeOptionSchema,
    type DateRangeSelectOption,
    dateRangeValueSchema,
} from './dateRangeOption';
import { getDatesForSelectorValue, getSelectableOptions } from './selectableOptions';
import { ErrorBoundary } from '../components/error-boundary';
import { Select } from '../components/select';
import type { ScaleType } from '../shared/charts/getYAxisScale';

const customOption = 'Custom';

const dateRangeSelectorInnerPropsSchema = z.object({
    dateRangeOptions: z.array(dateRangeOptionSchema),
    earliestDate: z.string().date(),
    value: dateRangeValueSchema.optional(),
    lapisDateField: z.string().min(1),
});

const dateRangeSelectorPropsSchema = dateRangeSelectorInnerPropsSchema.extend({
    width: z.string(),
});

export type DateRangeSelectorProps = z.infer<typeof dateRangeSelectorPropsSchema>;
export type DateRangeSelectorInnerProps = z.infer<typeof dateRangeSelectorInnerPropsSchema>;

export const DateRangeSelector = (props: DateRangeSelectorProps) => {
    const { width, ...innerProps } = props;
    const size = { width, height: '3rem' };

    return (
        <ErrorBoundary size={size} layout='horizontal' componentProps={props} schema={dateRangeSelectorPropsSchema}>
            <div style={{ width }}>
                <DateRangeSelectorInner {...innerProps} />
            </div>
        </ErrorBoundary>
    );
};

export const DateRangeSelectorInner = ({
    dateRangeOptions,
    earliestDate = '1900-01-01',
    value,
    lapisDateField,
}: DateRangeSelectorInnerProps) => {
    const initialValues = useMemo(
        () => computeInitialValues(value, earliestDate, dateRangeOptions),
        [value, earliestDate, dateRangeOptions],
    );

    const fromDatePickerRef = useRef<HTMLInputElement>(null);
    const toDatePickerRef = useRef<HTMLInputElement>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const [dateFromPicker, setDateFromPicker] = useState<flatpickr.Instance | null>(null);
    const [dateToPicker, setDateToPicker] = useState<flatpickr.Instance | null>(null);

    const [selectedDateRange, setSelectedDateRange] = useState<string | undefined>(
        initialValues.initialSelectedDateRange,
    );

    const [selectedDates, setSelectedDates] = useState<{ dateFrom: Date; dateTo: Date }>({
        dateFrom: initialValues.initialSelectedDateFrom,
        dateTo: initialValues.initialSelectedDateTo,
    });

    useEffect(() => {
        setSelectedDateRange(initialValues.initialSelectedDateRange);
        setSelectedDates({
            dateFrom: initialValues.initialSelectedDateFrom,
            dateTo: initialValues.initialSelectedDateTo,
        });

        const commonConfig = {
            allowInput: true,
            dateFormat: 'Y-m-d',
        };

        if (fromDatePickerRef.current) {
            setDateFromPicker(
                flatpickr(fromDatePickerRef.current, {
                    ...commonConfig,
                    defaultDate: initialValues.initialSelectedDateFrom,
                }),
            );
        }

        if (toDatePickerRef.current) {
            setDateToPicker(
                flatpickr(toDatePickerRef.current, {
                    ...commonConfig,
                    defaultDate: initialValues.initialSelectedDateTo,
                }),
            );
        }

        return () => {
            setDateFromPicker((prev) => {
                prev?.destroy();
                return null;
            });
            setDateToPicker((prev) => {
                prev?.destroy();
                return null;
            });
        };
    }, [fromDatePickerRef, toDatePickerRef, initialValues]);

    const onSelectChange = (value: string) => {
        setSelectedDateRange(value);

        const dateRange = getDatesForSelectorValue(value, dateRangeOptions, earliestDate);

        dateToPicker?.set('minDate', dateRange.dateFrom);
        dateFromPicker?.set('maxDate', dateRange.dateTo);

        dateFromPicker?.setDate(dateRange.dateFrom);
        dateToPicker?.setDate(dateRange.dateTo);

        setSelectedDates({
            dateFrom: dateRange.dateFrom,
            dateTo: dateRange.dateTo,
        });

        fireFilterChangedEvent();
        fireOptionChangedEvent(value);
    };

    const onChangeDateFrom = () => {
        if (selectedDates.dateFrom.toDateString() === dateFromPicker?.selectedDates[0].toDateString()) {
            return;
        }

        const dateTo = dateToPicker?.selectedDates[0];
        const dateFrom = dateFromPicker?.selectedDates[0];

        selectedDates.dateFrom = dateFrom || new Date();
        dateToPicker?.set('minDate', dateFrom);
        setSelectedDateRange(customOption);

        fireFilterChangedEvent();
        fireOptionChangedEvent({
            dateFrom: dateFrom !== undefined ? toYYYYMMDD(dateFrom) : earliestDate,
            dateTo: toYYYYMMDD(dateTo || new Date())!,
        });
    };

    const onChangeDateTo = () => {
        if (selectedDates.dateTo.toDateString() === dateToPicker?.selectedDates[0].toDateString()) {
            return;
        }

        const dateTo = dateToPicker?.selectedDates[0];
        const dateFrom = dateFromPicker?.selectedDates[0];

        selectedDates.dateTo = dateTo || new Date();
        dateFromPicker?.set('maxDate', dateTo);
        setSelectedDateRange(customOption);

        fireFilterChangedEvent();
        fireOptionChangedEvent({
            dateFrom: dateFrom !== undefined ? toYYYYMMDD(dateFrom) : earliestDate,
            dateTo: toYYYYMMDD(dateTo || new Date())!,
        });
    };

    const fireOptionChangedEvent = (option: DateRangeSelectOption) => {
        divRef.current?.dispatchEvent(new DateRangeOptionChangedEvent(option));
    };

    const fireFilterChangedEvent = () => {
        const dateFrom = dateFromPicker?.selectedDates[0];
        const dateTo = dateToPicker?.selectedDates[0];

        const detail = {
            ...(dateFrom !== undefined && { [`${lapisDateField}From`]: toYYYYMMDD(dateFrom) }),
            ...(dateTo !== undefined && { [`${lapisDateField}To`]: toYYYYMMDD(dateTo) }),
        };

        divRef.current?.dispatchEvent(
            new CustomEvent('gs-date-range-filter-changed', {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    };

    return (
        <div class='flex flex-wrap' ref={divRef}>
            <Select
                items={[
                    ...getSelectableOptions(dateRangeOptions),
                    { label: customOption, value: customOption, disabled: true },
                ]}
                selected={selectedDateRange ?? customOption}
                selectStyle='select-bordered rounded-none flex-grow min-w-[7.5rem]'
                onChange={(event: Event) => {
                    event.preventDefault();
                    const select = event.target as HTMLSelectElement;
                    const value = select.value as ScaleType;
                    onSelectChange(value);
                }}
            />
            <div className={'flex flex-wrap flex-grow'}>
                <input
                    class='input input-bordered rounded-none flex-grow w-[7.5rem]'
                    type='text'
                    placeholder='Date from'
                    ref={fromDatePickerRef}
                    onChange={onChangeDateFrom}
                    onBlur={onChangeDateFrom}
                />
                <input
                    class='input input-bordered rounded-none flex-grow w-[7.5rem]'
                    type='text'
                    placeholder='Date to'
                    ref={toDatePickerRef}
                    onChange={onChangeDateTo}
                    onBlur={onChangeDateTo}
                />
            </div>
        </div>
    );
};

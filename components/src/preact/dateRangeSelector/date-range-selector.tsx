import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { useEffect, useRef, useState } from 'preact/hooks';

import { computeInitialValues } from './computeInitialValues';
import { toYYYYMMDD } from './dateConversion';
import { type DateRangeOption } from './dateRangeOption';
import { getDatesForSelectorValue, getSelectableOptions } from './selectableOptions';
import { ErrorBoundary } from '../components/error-boundary';
import { Select } from '../components/select';
import type { ScaleType } from '../shared/charts/getYAxisScale';

const customOption = 'Custom';

export interface DateRangeSelectorProps extends DateRangeSelectorPropsInner {
    width: string;
}

export interface DateRangeSelectorPropsInner {
    dateRangeOptions: DateRangeOption[];
    earliestDate: string;
    initialValue: string | undefined;
    initialDateFrom: string;
    initialDateTo: string;
    dateColumn: string;
}

export const DateRangeSelector = ({ width, ...innerProps }: DateRangeSelectorProps) => {
    const size = { width, height: '3rem' };

    return (
        <ErrorBoundary size={size}>
            <div style={{ width }}>
                <DateRangeSelectorInner {...innerProps} />
            </div>
        </ErrorBoundary>
    );
};

export const DateRangeSelectorInner = ({
    dateRangeOptions,
    earliestDate = '1900-01-01',
    initialValue,
    dateColumn,
    initialDateFrom,
    initialDateTo,
}: DateRangeSelectorPropsInner) => {
    const initialValues = computeInitialValues(
        initialValue,
        initialDateFrom,
        initialDateTo,
        earliestDate,
        dateRangeOptions,
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
        const commonConfig = {
            allowInput: true,
            dateFormat: 'Y-m-d',
        };

        if (fromDatePickerRef.current) {
            setDateFromPicker(
                flatpickr(fromDatePickerRef.current, {
                    ...commonConfig,
                    defaultDate: selectedDates.dateFrom,
                }),
            );
        }

        if (toDatePickerRef.current) {
            setDateToPicker(
                flatpickr(toDatePickerRef.current, {
                    ...commonConfig,
                    defaultDate: selectedDates.dateTo,
                }),
            );
        }

        return () => {
            dateFromPicker?.destroy();
            dateToPicker?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromDatePickerRef, toDatePickerRef]);

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

        submit();
    };

    const onChangeDateFrom = () => {
        if (selectedDates.dateFrom.toDateString() === dateFromPicker?.selectedDates[0].toDateString()) {
            return;
        }

        selectedDates.dateFrom = dateFromPicker?.selectedDates[0] || new Date();
        dateToPicker?.set('minDate', dateFromPicker?.selectedDates[0]);
        setSelectedDateRange(customOption);

        submit();
    };

    const onChangeDateTo = () => {
        if (selectedDates.dateTo.toDateString() === dateToPicker?.selectedDates[0].toDateString()) {
            return;
        }

        selectedDates.dateTo = dateToPicker?.selectedDates[0] || new Date();
        dateFromPicker?.set('maxDate', dateToPicker?.selectedDates[0]);
        setSelectedDateRange(customOption);

        submit();
    };

    const submit = () => {
        const dateFrom = toYYYYMMDD(dateFromPicker?.selectedDates[0]);
        const dateTo = toYYYYMMDD(dateToPicker?.selectedDates[0]);

        const detail = {
            ...(dateFrom !== undefined && { [`${dateColumn}From`]: dateFrom }),
            ...(dateTo !== undefined && { [`${dateColumn}To`]: dateTo }),
        };

        divRef.current?.dispatchEvent(
            new CustomEvent('gs-date-range-changed', {
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

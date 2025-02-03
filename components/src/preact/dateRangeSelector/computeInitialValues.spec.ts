import { describe, expect, it } from 'vitest';

import { computeInitialValues } from './computeInitialValues';

const today = new Date();
const earliestDate = '1900-01-01';

const fromOption = 'fromOption';
const toOption = 'toOption';
const fromToOption = 'fromToOption';
const dateFromOptionValue = '2010-06-30';
const dateToOptionValue = '2020-01-01';

const dateRangeOptions = [
    { label: fromOption, dateFrom: dateFromOptionValue },
    { label: toOption, dateTo: dateToOptionValue },
    { label: fromToOption, dateFrom: dateFromOptionValue, dateTo: dateToOptionValue },
];

describe('computeInitialValues', () => {
    it('should compute initial value if value is dateRangeOption label', () => {
        const result = computeInitialValues(fromToOption, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toEqual(fromToOption);
        expectDateMatches(result.initialSelectedDateFrom, new Date(dateFromOptionValue));
        expectDateMatches(result.initialSelectedDateTo, new Date(dateToOptionValue));
    });

    it('should use today as "dateTo" if it is unset in selected option', () => {
        const result = computeInitialValues(fromOption, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toEqual(fromOption);
        expectDateMatches(result.initialSelectedDateFrom, new Date(dateFromOptionValue));
        expectDateMatches(result.initialSelectedDateTo, today);
    });

    it('should use earliest date as "dateFrom" if it is unset in selected option', () => {
        const result = computeInitialValues(toOption, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toEqual(toOption);
        expectDateMatches(result.initialSelectedDateFrom, new Date(earliestDate));
        expectDateMatches(result.initialSelectedDateTo, new Date(dateToOptionValue));
    });

    it('should fall back to full range if initial value is not set', () => {
        const result = computeInitialValues(undefined, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toBeUndefined();
        expectDateMatches(result.initialSelectedDateFrom, new Date(earliestDate));
        expectDateMatches(result.initialSelectedDateTo, today);
    });

    it('should throw when initial value is unknown', () => {
        expect(() => computeInitialValues('not a known value', earliestDate, dateRangeOptions)).toThrowError(
            /Invalid value "not a known value", It must be one of/,
        );
    });

    it('should throw when initial value is set but no options are provided', () => {
        expect(() => computeInitialValues('not a known value', earliestDate, [])).toThrowError(
            /There are no selectable options/,
        );
    });

    it('should select from date until today if only dateFrom is given', () => {
        const initialDateFrom = '2020-01-01';
        const result = computeInitialValues({ dateFrom: initialDateFrom }, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toBeUndefined();
        expectDateMatches(result.initialSelectedDateFrom, new Date(initialDateFrom));
        expectDateMatches(result.initialSelectedDateTo, today);
    });

    it('should select from earliest date until date if only dateTo is given', () => {
        const initialDateTo = '2020-01-01';
        const result = computeInitialValues({ dateTo: initialDateTo }, earliestDate, dateRangeOptions);

        expect(result.initialSelectedDateRange).toBeUndefined();
        expectDateMatches(result.initialSelectedDateFrom, new Date(earliestDate));
        expectDateMatches(result.initialSelectedDateTo, new Date(initialDateTo));
    });

    it('should select date range is dateFrom and dateTo are given', () => {
        const initialDateFrom = '2020-01-01';
        const initialDateTo = '2022-01-01';
        const result = computeInitialValues(
            {
                dateFrom: initialDateFrom,
                dateTo: initialDateTo,
            },
            earliestDate,
            dateRangeOptions,
        );

        expect(result.initialSelectedDateRange).toBeUndefined();
        expectDateMatches(result.initialSelectedDateFrom, new Date(initialDateFrom));
        expectDateMatches(result.initialSelectedDateTo, new Date(initialDateTo));
    });

    it('should set initial "to" to "from" if "from" is after "to"', () => {
        const initialDateFrom = '2020-01-01';
        const initialDateTo = '1900-01-01';
        const result = computeInitialValues(
            {
                dateFrom: initialDateFrom,
                dateTo: initialDateTo,
            },
            earliestDate,
            dateRangeOptions,
        );

        expect(result.initialSelectedDateRange).toBeUndefined();
        expectDateMatches(result.initialSelectedDateFrom, new Date(initialDateFrom));
        expectDateMatches(result.initialSelectedDateTo, new Date(initialDateFrom));
    });

    it('should throw if initial "from" is not a valid date', () => {
        expect(() => computeInitialValues({ dateFrom: 'not a date' }, earliestDate, [])).toThrowError(
            'Invalid value.dateFrom',
        );
    });

    it('should throw if initial "to" is not a valid date', () => {
        expect(() => computeInitialValues({ dateTo: 'not a date' }, earliestDate, [])).toThrowError(
            'Invalid value.dateTo',
        );
    });

    function expectDateMatches(actual: Date, expected: Date) {
        expect(actual.getFullYear()).toEqual(expected.getFullYear());
        expect(actual.getMonth()).toEqual(expected.getMonth());
        expect(actual.getDate()).toEqual(expected.getDate());
    }
});

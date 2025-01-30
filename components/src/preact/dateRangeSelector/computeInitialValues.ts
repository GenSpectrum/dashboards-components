import { type DateRangeOption, type DateRangeValue } from './dateRangeOption';
import { getDatesForSelectorValue, getSelectableOptions } from './selectableOptions';
import { UserFacingError } from '../components/error-display';

export function computeInitialValues(
    value: DateRangeValue | undefined,
    earliestDate: string,
    dateRangeOptions: DateRangeOption[],
): {
    initialSelectedDateRange: string | undefined;
    initialSelectedDateFrom: Date;
    initialSelectedDateTo: Date;
} {
    if (value === undefined) {
        const { dateFrom, dateTo } = getDatesForSelectorValue(undefined, dateRangeOptions, earliestDate);
        return {
            initialSelectedDateRange: undefined,
            initialSelectedDateFrom: dateFrom,
            initialSelectedDateTo: dateTo,
        };
    }

    if (typeof value === 'string') {
        const selectableOptions = getSelectableOptions(dateRangeOptions);
        const initialSelectedDateRange = selectableOptions.find((option) => option.value === value)?.value;

        if (initialSelectedDateRange === undefined) {
            if (selectableOptions.length === 0) {
                throw new UserFacingError('Invalid value', 'There are no selectable options, but value is set.');
            }
            throw new UserFacingError(
                'Invalid value',
                `Invalid value "${value}", It must be one of ${selectableOptions.map((option) => `'${option.value}'`).join(', ')}`,
            );
        }

        const { dateFrom, dateTo } = getDatesForSelectorValue(initialSelectedDateRange, dateRangeOptions, earliestDate);

        return {
            initialSelectedDateRange,
            initialSelectedDateFrom: dateFrom,
            initialSelectedDateTo: dateTo,
        };
    }

    const { dateFrom, dateTo } = value;

    const initialSelectedDateFrom = isUndefinedOrEmpty(dateFrom) ? new Date(earliestDate) : new Date(dateFrom);
    let initialSelectedDateTo = isUndefinedOrEmpty(dateTo) ? new Date() : new Date(dateTo);

    if (isNaN(initialSelectedDateFrom.getTime())) {
        throw new UserFacingError(
            'Invalid value.dateFrom',
            `Invalid value.dateFrom "${dateFrom}", It must be of the format YYYY-MM-DD`,
        );
    }
    if (isNaN(initialSelectedDateTo.getTime())) {
        throw new UserFacingError(
            'Invalid value.dateTo',
            `Invalid value.dateTo "${dateTo}", It must be of the format YYYY-MM-DD`,
        );
    }

    if (initialSelectedDateFrom > initialSelectedDateTo) {
        initialSelectedDateTo = initialSelectedDateFrom;
    }

    return {
        initialSelectedDateRange: undefined,
        initialSelectedDateFrom,
        initialSelectedDateTo,
    };
}

function isUndefinedOrEmpty(value: string | undefined): value is undefined | '' {
    return value === undefined || value === '';
}

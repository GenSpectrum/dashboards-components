import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { DateRangeSelector, type DateRangeSelectorProps } from '../../preact/dateRangeSelector/date-range-selector';
import { type DateRangeOptionChangedEvent } from '../../preact/dateRangeSelector/dateRangeOption';
import { type Equals, type Expect } from '../../utils/typeAssertions';
import { PreactLitAdapter } from '../PreactLitAdapter';

/**
 * ## Context
 * This component is a group of input fields designed to specify date range filters
 * for a given date column of this Lapis instance. It consists of 3 fields:
 *
 * - a select field to choose a predefined date range,
 * - an input field with an attached date picker for the start date,
 * - an input field with an attached date picker for the end date.
 *
 * Setting a value in the select field will overwrite the previous values of the start and end date.
 * Setting a value in either of the date pickers will set the select field to "custom",
 * which represents an arbitrary date range.
 *
 * @fires {CustomEvent<{ `${dateColumn}From`: string; `${dateColumn}To`: string; }>} gs-date-range-filter-changed
 * Fired when:
 * - The select field is changed,
 * - A date is selected in either of the date pickers,
 * - A date was typed into either of the date input fields, and the input field loses focus ("on blur").
 * Contains the dates in the format `YYYY-MM-DD`.
 *
 * Example: For `dateColumn = yourDate`, an event with `detail` containing
 * ```
 * {
 *  yourDataFrom: "2021-01-01",
 *  yourDataTo: "2021-12-31"
 * }
 *  ```
 *  will be fired.
 *
 *  Use this event, when you want to use the filter directly as a LAPIS filter.
 *
 *
 * @fires {CustomEvent<{ string | {dateFrom: string, dateTo: string}}>} gs-date-range-option-changed
 * Fired when:
 * - The select field is changed,
 * - A date is selected in either of the date pickers,
 * - A date was typed into either of the date input fields, and the input field loses focus ("on blur").
 * Contains the selected dateRangeOption or when users select custom values it contains the selected dates.
 *
 * Use this event, when you want to control this component in your JS application.
 * You can supply the `detail` of this event to the `value` attribute of this component.
 */
@customElement('gs-date-range-selector')
export class DateRangeSelectorComponent extends PreactLitAdapter {
    /**
     * An array of date range options that the select field should provide.
     * The `label` will be shown to the user, and it will be available as `value`.
     * The dates must be in the format `YYYY-MM-DD`.
     *
     * If dateFrom or dateTo is not set, the component will default to the `earliestDate` or the current date.
     *
     * We provide some options in `dateRangeOptionPresets` for convenience.
     */
    @property({ type: Array })
    dateRangeOptions: { label: string; dateFrom?: string; dateTo?: string }[] = [];

    /**
     * The `dateFrom` value to use in the `allTimes` preset in the format `YYYY-MM-DD`.
     */
    @property({ type: String })
    earliestDate: string = '1900-01-01';

    /**
     * The value to use for this date range selector.
     * - If it is a string, then it must be a valid label from the `dateRangeOptions`.
     * - If it is an object, then it accepts dates in the format `YYYY-MM-DD` for the keys `dateFrom` and `dateTo`.
     *   Keys that are not set will default to the `earliestDate` or the current date respectively.
     * - If the attribute is not set, the component will default to the range `earliestDate` until today.
     *
     * The `detail` of the `gs-date-range-option-changed` event can be used for this attribute,
     * if you want to control this component in your JS application.
     */
    @property({ type: Object })
    value: string | { dateFrom?: string; dateTo?: string } | undefined = undefined;

    /**
     * The width of the component.
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    width: string = '100%';

    /**
     * The name of the metadata field in LAPIS that contains the date information.
     */
    @property({ type: String })
    lapisDateField: string = '';

    override render() {
        return (
            <DateRangeSelector
                dateRangeOptions={this.dateRangeOptions}
                earliestDate={this.earliestDate}
                value={this.value}
                lapisDateField={this.lapisDateField}
                width={this.width}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-date-range-selector': DateRangeSelectorComponent;
    }

    interface HTMLElementEventMap {
        'gs-date-range-filter-changed': CustomEvent<Record<string, string>>;
        'gs-date-range-option-changed': DateRangeOptionChangedEvent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-date-range-selector': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type CustomSelectOptionsMatches = Expect<
    Equals<typeof DateRangeSelectorComponent.prototype.dateRangeOptions, DateRangeSelectorProps['dateRangeOptions']>
>;
type EarliestDateMatches = Expect<
    Equals<typeof DateRangeSelectorComponent.prototype.earliestDate, DateRangeSelectorProps['earliestDate']>
>;
type ValueMatches = Expect<Equals<typeof DateRangeSelectorComponent.prototype.value, DateRangeSelectorProps['value']>>;
type WidthMatches = Expect<Equals<typeof DateRangeSelectorComponent.prototype.width, DateRangeSelectorProps['width']>>;
type DateColumnMatches = Expect<
    Equals<typeof DateRangeSelectorComponent.prototype.lapisDateField, DateRangeSelectorProps['lapisDateField']>
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

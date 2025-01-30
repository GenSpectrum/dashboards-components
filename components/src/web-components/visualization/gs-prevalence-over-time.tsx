import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { PrevalenceOverTime, type PrevalenceOverTimeProps } from '../../preact/prevalenceOverTime/prevalence-over-time';
import { type Equals, type Expect } from '../../utils/typeAssertions';
import { PreactLitAdapterWithGridJsStyles } from '../PreactLitAdapterWithGridJsStyles';

/**
 * ## Context
 *
 * This component displays the prevalence over time of one or more datasets, selected by LAPIS filters.
 * The prevalence is calculated as the ratio of the number of cases of each dataset to the number of cases of a reference dataset.
 * The reference dataset is also selected by a LAPIS filter.
 *
 * In the chart views,
 * - the user can select whether to display a confidence interval (not available in the bubble chart).
 *   The confidence interval is calculated using [Wilson score interval](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval),
 *   with a confidence level of 95%.
 * - the x-axis shows time steps in the selected `granularity`.
 * - the user can select the y-axis scale (linear, logistic, logit).
 *
 * ## Views
 *
 * ### Bar View
 *
 * Displays the prevalence over time as a bar chart.
 * Shows a bar for each dataset of the `numeratorFilter` on every time step.
 *
 * ### Line View
 *
 * Displays the prevalence over time as a line chart.
 * Each data point is connected for better visibility.
 * Shows a line for each dataset of the `numeratorFilter`.
 *
 * ### Bubble View
 *
 * Displays the prevalence over time as a bubble chart.
 * The size of the bubbles represents the number of cases of the reference, defined by the `denominatorFilter`.
 * The height of the bubbles represents the prevalence of the datasets selected by the `numeratorFilters`.
 *
 * ### Table View
 *
 * Displays the prevalence over time as a table with one row per time point.
 */
@customElement('gs-prevalence-over-time')
export class PrevalenceOverTimeComponent extends PreactLitAdapterWithGridJsStyles {
    /**
     * Either a LAPIS filter or an array of LAPIS filters to calculate the prevalence for.
     *
     * The `lapisFilter` will be sent as is to LAPIS to select the data.
     * It must be a valid LAPIS filter object.
     *
     * The `displayName` will be used as the label the prevalence in the views.
     * It should be human-readable.
     *
     */
    @property({ type: Object })
    numeratorFilters: {
        lapisFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
            nucleotideMutations?: string[];
            aminoAcidMutations?: string[];
            nucleotideInsertions?: string[];
            aminoAcidInsertions?: string[];
        };
        displayName: string;
    }[] = [];

    /**
     * The LAPIS filter, to select the data of the reference.
     * It must be a valid LAPIS filter object.
     */
    @property({ type: Object })
    denominatorFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    } = {};

    /**
     * The granularity of the time axis.
     */
    @property({ type: String })
    granularity: 'day' | 'week' | 'month' | 'year' = 'day';

    /**
     * The number of time steps to use for smoothing the data.
     * `0` means no smoothing.
     * Must be a non-negative integer.
     *
     * For a given time, the shown value is the mean of the neighbouring measured values.
     * The `smoothingWindow` value provides the number of neighbouring values to take into account.
     * The resulting time is computed via `Math.floor(smoothingWindow / 2)`.
     */
    @property({ type: Number })
    smoothingWindow: number = 0;

    /**
     * A list of tabs with views that this component should provide.
     */
    @property({ type: Array })
    views: ('bar' | 'line' | 'bubble' | 'table')[] = ['bar', 'line', 'bubble', 'table'];

    /**
     * A list of methods to calculate the confidence interval.
     * Pass an empty array to disable the confidence interval selector.
     * The first entry will be selected by default.
     */
    @property({ type: Array })
    confidenceIntervalMethods: ('wilson' | 'none')[] = ['none', 'wilson'];

    /**
     * The width of the component.
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    width: string = '100%';

    /**
     * The height of the component.
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    height: string | undefined = undefined;

    /**
     * Required.
     *
     * The LAPIS field that the data should be aggregated by.
     * The values will be used on the x-axis of the diagram.
     * Must be a field of type `date` in LAPIS.
     */
    @property({ type: String })
    lapisDateField: string = '';

    /**
     * The maximum number of rows to display in the table view.
     * Set to `false` to disable pagination. Set to `true` to enable pagination with a default limit (10).
     */
    @property({ type: Object })
    pageSize: boolean | number = false;

    /**
     * The maximum value for the y-axis on all graphs in linear view.
     * If set to a number, the maximum value is set to this number.
     * If set to `maxInData`, the maximum value is set to the maximum value in the data.
     * If set to `limitTo1`, the maximum value is set to `min(1, the maximum value in the data)`.
     * If not set, the maximum value is set to the default value (1).
     */
    @property({ type: String })
    yAxisMaxLinear: 'maxInData' | 'limitTo1' | number = 1;

    /**
     * The maximum value for the y-axis on all graphs in logarithmic view.
     * If set to a number, the maximum value is set to this number.
     * If set to `maxInData`, the maximum value is set to the maximum value in the data.
     * If set to `limitTo1`, the maximum value is set to `min(1, the maximum value in the data)`.
     * If not set, the maximum value is set to the default value (1).
     */
    @property({ type: String })
    yAxisMaxLogarithmic: 'maxInData' | 'limitTo1' | number = 1;

    override render() {
        return (
            <PrevalenceOverTime
                numeratorFilters={this.numeratorFilters}
                denominatorFilter={this.denominatorFilter}
                granularity={this.granularity}
                smoothingWindow={this.smoothingWindow}
                views={this.views}
                confidenceIntervalMethods={this.confidenceIntervalMethods}
                width={this.width}
                height={this.height}
                lapisDateField={this.lapisDateField}
                pageSize={this.pageSize}
                yAxisMaxLinear={this.yAxisMaxLinear}
                yAxisMaxLogarithmic={this.yAxisMaxLogarithmic}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-prevalence-over-time': PrevalenceOverTimeComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-prevalence-over-time': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type NumeratorMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.numeratorFilters, PrevalenceOverTimeProps['numeratorFilters']>
>;
type DenominatorMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.denominatorFilter, PrevalenceOverTimeProps['denominatorFilter']>
>;
type GranularityMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.granularity, PrevalenceOverTimeProps['granularity']>
>;
type SmoothingWindowMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.smoothingWindow, PrevalenceOverTimeProps['smoothingWindow']>
>;
type ViewsMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.views, PrevalenceOverTimeProps['views']>
>;
type ConfidenceIntervalMethodsMatches = Expect<
    Equals<
        typeof PrevalenceOverTimeComponent.prototype.confidenceIntervalMethods,
        PrevalenceOverTimeProps['confidenceIntervalMethods']
    >
>;
type WidhtMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.width, PrevalenceOverTimeProps['width']>
>;
type HeightMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.height, PrevalenceOverTimeProps['height']>
>;
type LapisDateFieldMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.lapisDateField, PrevalenceOverTimeProps['lapisDateField']>
>;
type PageSizeMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.pageSize, PrevalenceOverTimeProps['pageSize']>
>;
type YAxisMaxLinearMatches = Expect<
    Equals<typeof PrevalenceOverTimeComponent.prototype.yAxisMaxLinear, PrevalenceOverTimeProps['yAxisMaxLinear']>
>;
type YAxisMaxLogarithmicMatches = Expect<
    Equals<
        typeof PrevalenceOverTimeComponent.prototype.yAxisMaxLogarithmic,
        PrevalenceOverTimeProps['yAxisMaxLogarithmic']
    >
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

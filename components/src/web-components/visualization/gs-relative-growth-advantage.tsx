import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import {
    RelativeGrowthAdvantage,
    type RelativeGrowthAdvantageProps,
} from '../../preact/relativeGrowthAdvantage/relative-growth-advantage';
import { type Equals, type Expect } from '../../utils/typeAssertions';
import { PreactLitAdapter } from '../PreactLitAdapter';

/**
 * ## Context
 *
 * For this component, we assume a discrete time model, where new infections happen exactly every `generationTime` days.
 * This is what we call a "generation".
 *
 * This component estimates the relative growth advantage of a variant (defined by its LAPIS filter) by performing a logistic regression.
 * Based on the inferred logistic growth rate, we derive the relative growth advantage (per generation).
 *
 * For details on the scientific method, see:
 * Chen, Chaoran, et al. "Quantification of the spread of SARS-CoV-2 variant B.1.1.7 in Switzerland." Epidemics (2021);
 * doi: [10.1016/j.epidem.2021.100480](https://doi.org/10.1016/j.epidem.2021.100480)
 *
 * This component fetches aggregated data from LAPIS.
 * Then the data is sent to `https://cov-spectrum.org/api/v2/computed/model/chen2021Fitness`
 * which performs the logistic regression and calculates the relative growth advantage.
 *
 * ## Views
 *
 * ### Line View
 *
 * The line view shows the relative growth advantage over time in a line chart.
 * The dots in the plot show the proportions of the focal variant (defined by the `numeratorFilter`) to the baseline variant (defined by the `denominatorFilter`)
 * for every day as observed in the data.
 * The line shows a logistic curve fitted to the data points, including a 95% confidence interval.
 */
@customElement('gs-relative-growth-advantage')
export class RelativeGrowthAdvantageComponent extends PreactLitAdapter {
    /**
     * LAPIS filter to select the data of the focal variant.
     * It must be a valid LAPIS filter object.
     */
    @property({ type: Object })
    numeratorFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    } = {};

    /**
     * LAPIS filter to select the data of the baseline variant.
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
     * The generation time represents the number of days over which the variant's relative growth advantage is measured.
     * For example, if we set a generation time of 7 days, then we estimate the growth advantage per week.
     */
    @property({ type: Number })
    generationTime: number = 7;

    /**
     * A list of tabs with views that this component should provide.
     */
    @property({ type: Array })
    views: 'line'[] = ['line'];

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
            <RelativeGrowthAdvantage
                numeratorFilter={this.numeratorFilter}
                denominatorFilter={this.denominatorFilter}
                generationTime={this.generationTime}
                views={this.views}
                width={this.width}
                height={this.height}
                lapisDateField={this.lapisDateField}
                yAxisMaxLinear={this.yAxisMaxLinear}
                yAxisMaxLogarithmic={this.yAxisMaxLogarithmic}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-relative-growth-advantage': RelativeGrowthAdvantageComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-relative-growth-advantage': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type NumeratorMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.numeratorFilter,
        RelativeGrowthAdvantageProps['numeratorFilter']
    >
>;
type DenominatorMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.denominatorFilter,
        RelativeGrowthAdvantageProps['denominatorFilter']
    >
>;
type GenerationTimeMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.generationTime,
        RelativeGrowthAdvantageProps['generationTime']
    >
>;
type ViewsMatches = Expect<
    Equals<typeof RelativeGrowthAdvantageComponent.prototype.views, RelativeGrowthAdvantageProps['views']>
>;
type WidthMatches = Expect<
    Equals<typeof RelativeGrowthAdvantageComponent.prototype.width, RelativeGrowthAdvantageProps['width']>
>;
type HeightMatches = Expect<
    Equals<typeof RelativeGrowthAdvantageComponent.prototype.height, RelativeGrowthAdvantageProps['height']>
>;
type LapisDateFieldMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.lapisDateField,
        RelativeGrowthAdvantageProps['lapisDateField']
    >
>;
type YAxisMaxLinearMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.yAxisMaxLinear,
        RelativeGrowthAdvantageProps['yAxisMaxLinear']
    >
>;
type YAxisMaxLogarithmicMatches = Expect<
    Equals<
        typeof RelativeGrowthAdvantageComponent.prototype.yAxisMaxLogarithmic,
        RelativeGrowthAdvantageProps['yAxisMaxLogarithmic']
    >
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

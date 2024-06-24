import { customElement, property } from 'lit/decorators.js';

import {
    RelativeGrowthAdvantage,
    type RelativeGrowthAdvantageProps,
    type View,
} from '../../preact/relativeGrowthAdvantage/relative-growth-advantage';
import { type AxisMax } from '../../preact/shared/charts/getYAxisMax';
import type { LapisFilter } from '../../types';
import { type Equals, type Expect } from '../../utils/typeAssertions';
import { PreactLitAdapter } from '../PreactLitAdapter';

/**
 * ## Context
 *
 * For this component, we assume a discrete time model, where new infections happen exactly every `generationTime` days.
 * This is what we call a "generation".
 *
 * This component estimates the relative growth advantage of a variant by performing a logistic regression.
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
 * The dots in the plot show the proportions of the focal variant (`numerator`) to the `denominator` variant
 * for every day as observed in the data.
 * The line shows a logistic curve fitted to the data points, including a 95% confidence interval.
 */
@customElement('gs-relative-growth-advantage')
export class RelativeGrowthAdvantageComponent extends PreactLitAdapter {
    /**
     * Required.
     *
     * The LAPIS filter for the focal variant.
     */
    @property({ type: Object })
    numerator: Record<string, string | number | null | boolean> = {};

    /**
     * Required.
     *
     * The LAPIS filter for the variant that the focal variant (`numerator`) should be compared to.
     */
    @property({ type: Object })
    denominator: Record<string, string | number | null | boolean> = {};

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
     * The headline of the component. Set to an empty string to hide the headline.
     */
    @property({ type: String })
    headline: string = 'Relative growth advantage';

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
    height: string = '700px';

    /**
     * Required.
     *
     * The LAPIS field that the data should be aggregated by.
     * The values will be used on the x-axis of the diagram.
     * Must be a field of type `date` in LAPIS.
     */
    @property({ type: String })
    lapisDateField: string = 'date';

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
                numerator={this.numerator}
                denominator={this.denominator}
                generationTime={this.generationTime}
                views={this.views}
                width={this.width}
                height={this.height}
                headline={this.headline}
                lapisDateField={this.lapisDateField}
                yAxisMaxConfig={{
                    linear: this.yAxisMaxLinear,
                    logarithmic: this.yAxisMaxLogarithmic,
                }}
            />
        );
    }
}

export interface RelativeGrowthAdvantageComponentProps extends Omit<RelativeGrowthAdvantageProps, 'yAxisMaxConfig'> {
    yAxisMaxLinear?: AxisMax;
    yAxisMaxLogarithmic?: AxisMax;
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-relative-growth-advantage': RelativeGrowthAdvantageComponent;
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type NumeratorMatches = Expect<Equals<typeof RelativeGrowthAdvantageComponent.prototype.numerator, LapisFilter>>;
type DenominatorMatches = Expect<Equals<typeof RelativeGrowthAdvantageComponent.prototype.denominator, LapisFilter>>;
type ViewsMatches = Expect<Equals<typeof RelativeGrowthAdvantageComponent.prototype.views, View[]>>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

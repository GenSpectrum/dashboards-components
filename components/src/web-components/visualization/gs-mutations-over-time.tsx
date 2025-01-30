import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { MutationsOverTime, type MutationsOverTimeProps } from '../../preact/mutationsOverTime/mutations-over-time';
import type { Equals, Expect } from '../../utils/typeAssertions';
import { PreactLitAdapterWithGridJsStyles } from '../PreactLitAdapterWithGridJsStyles';

/**
 * ## Context
 *
 * This component displays mutations (substitutions and deletions) over time for a dataset selected by a LAPIS filter.
 * The shown date range is determined by the date field in the LAPIS filter.
 * If the date field is not set, the date range is determined by all available dates in the dataset.
 *
 * ## Views
 *
 * ### Grid View
 *
 * The grid view shows the proportion for each mutation over date ranges.
 *
 * The grid limits the number of rows and columns for browser performance reasons as
 * too much data might make the browser unresponsive.
 *
 * The number of columns is limited to 200.
 * If this number are exceeded, an error message will be shown.
 * It is your responsibility to make sure that this does not happen.
 * Depending on the selected date range in the `lapisFilter`, you can adapt the granularity accordingly
 * (e.g. use months instead of days).
 *
 * The number of rows is limited to 100.
 * If there are more, the component will only show 100 mutations and notify the user.
 */
@customElement('gs-mutations-over-time')
export class MutationsOverTimeComponent extends PreactLitAdapterWithGridJsStyles {
    /**
     * LAPIS filter to select the displayed data. If not provided, all data is displayed.
     */
    @property({ type: Object })
    lapisFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    } = {};

    /**
     * The type of the sequence for which the mutations should be shown.
     */
    @property({ type: String })
    sequenceType: 'nucleotide' | 'amino acid' = 'nucleotide';

    /**
     * A list of tabs with views that this component should provide.
     */
    @property({ type: Array })
    views: 'grid'[] = ['grid'];

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
     * The granularity of the time axis.
     */
    @property({ type: String })
    granularity: 'day' | 'week' | 'month' | 'year' = 'week';

    /**
     * Required.
     *
     * The LAPIS field that the data should be aggregated by.
     * The values will be used for the columns of the grid.
     * Must be a field of type `date` in LAPIS.
     */
    @property({ type: String })
    lapisDateField: string = 'date';

    override render() {
        return (
            <MutationsOverTime
                lapisFilter={this.lapisFilter}
                sequenceType={this.sequenceType}
                views={this.views}
                width={this.width}
                height={this.height}
                granularity={this.granularity}
                lapisDateField={this.lapisDateField}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-mutations-over-time': MutationsOverTimeComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-mutations-over-time': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type LapisFilterMatches = Expect<
    Equals<typeof MutationsOverTimeComponent.prototype.lapisFilter, MutationsOverTimeProps['lapisFilter']>
>;
type SequenceTypeMatches = Expect<
    Equals<typeof MutationsOverTimeComponent.prototype.sequenceType, MutationsOverTimeProps['sequenceType']>
>;
type ViewsMatches = Expect<Equals<typeof MutationsOverTimeComponent.prototype.views, MutationsOverTimeProps['views']>>;
type WidthMatches = Expect<Equals<typeof MutationsOverTimeComponent.prototype.width, MutationsOverTimeProps['width']>>;
type HeightMatches = Expect<
    Equals<typeof MutationsOverTimeComponent.prototype.height, MutationsOverTimeProps['height']>
>;
type GranularityMatches = Expect<
    Equals<typeof MutationsOverTimeComponent.prototype.granularity, MutationsOverTimeProps['granularity']>
>;
type LapisDateFieldMatches = Expect<
    Equals<typeof MutationsOverTimeComponent.prototype.lapisDateField, MutationsOverTimeProps['lapisDateField']>
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

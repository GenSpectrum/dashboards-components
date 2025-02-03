import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { MutationComparison, type MutationComparisonProps } from '../../preact/mutationComparison/mutation-comparison';
import { type Equals, type Expect } from '../../utils/typeAssertions';
import { PreactLitAdapterWithGridJsStyles } from '../PreactLitAdapterWithGridJsStyles';

/**
 * ## Context
 *
 * This component allows to compare mutations between two different datasets.
 * The datasets are selected by LAPIS filters.
 *
 * It only shows substitutions and deletions, it does not show insertions.
 *
 * ## Views
 *
 * ### Table View
 *
 * The table view shows mutations and the proportions with which the mutation occurs in the respective data subsets.
 * It only shows mutations that are present in at least one of the data subsets
 * and where the proportion is within the selected proportion interval for at least one data subset.
 *
 * ### Venn View
 *
 * The Venn view shows the overlap of mutations between the datasets in a Venn diagram.
 * A dataset is considered to have a certain mutation, if the proportion of the mutation in the dataset is within the
 * selected proportion interval.
 * Thus, changing the proportion interval may change a mutations from being "common" between the datasets
 * to being "for one dataset only".
 */
@customElement('gs-mutation-comparison')
export class MutationComparisonComponent extends PreactLitAdapterWithGridJsStyles {
    /**
     * Required.
     *
     * An array of LAPIS filters to select the data to compare.
     *
     * The `lapisFilter` will be sent as is to LAPIS to filter the mutation data.
     * It must be a valid LAPIS filter object.
     *
     * The `displayName` will be used as the label for the filtered dataset in the views.
     * It should be human-readable.
     */
    @property({ type: Array })
    lapisFilters: {
        lapisFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
            nucleotideMutations?: string[];
            aminoAcidMutations?: string[];
            nucleotideInsertions?: string[];
            aminoAcidInsertions?: string[];
        };
        displayName: string;
    }[] = [];

    /**
     * The type of the sequence for which the mutations should be shown.
     */
    @property({ type: String })
    sequenceType: 'nucleotide' | 'amino acid' = 'nucleotide';

    /**
     * A list of tabs with views that this component should provide.
     */
    @property({ type: Array })
    views: ('table' | 'venn')[] = ['table'];

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
     * The maximum number of rows to display in the table view.
     * Set to `false` to disable pagination. Set to `true` to enable pagination with a default limit (10).
     */
    @property({ type: Object })
    pageSize: boolean | number = false;

    override render() {
        return (
            <MutationComparison
                lapisFilters={this.lapisFilters}
                sequenceType={this.sequenceType}
                views={this.views}
                width={this.width}
                height={this.height}
                pageSize={this.pageSize}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-mutation-comparison-component': MutationComparisonComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-mutation-comparison-component': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type LapisFiltersMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.lapisFilters, MutationComparisonProps['lapisFilters']>
>;
type SequenceTypeMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.sequenceType, MutationComparisonProps['sequenceType']>
>;
type ViewsMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.views, MutationComparisonProps['views']>
>;
type WidthMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.width, MutationComparisonProps['width']>
>;
type HeightMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.height, MutationComparisonProps['height']>
>;
type PageSizeMatches = Expect<
    Equals<typeof MutationComparisonComponent.prototype.pageSize, MutationComparisonProps['pageSize']>
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

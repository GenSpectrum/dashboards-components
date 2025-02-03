import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { Statistics, type StatisticsProps } from '../../preact/statistic/statistics';
import type { Equals, Expect } from '../../utils/typeAssertions';
import { PreactLitAdapterWithGridJsStyles } from '../PreactLitAdapterWithGridJsStyles';

/**
 * ## Context
 *
 * This component displays general statistics (number of sequences, overall proportion)
 * for a given numerator and denominator filter.
 */
@customElement('gs-statistics')
export class StatisticsComponent extends PreactLitAdapterWithGridJsStyles {
    /**
     * The filter to apply to the data for the overall number of sequences and as the numerator for the proportion.
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
     * The filter to apply to the data for the denominator of the proportion.
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

    override render() {
        return (
            <Statistics
                numeratorFilter={this.numeratorFilter}
                denominatorFilter={this.denominatorFilter}
                width={this.width}
                height={this.height}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-statistics': StatisticsComponent;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-statistics': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type WidthMatches = Expect<Equals<typeof StatisticsComponent.prototype.width, StatisticsProps['width']>>;
type HeightMatches = Expect<Equals<typeof StatisticsComponent.prototype.height, StatisticsProps['height']>>;
type DenominatorFilterMatches = Expect<
    Equals<typeof StatisticsComponent.prototype.denominatorFilter, StatisticsProps['denominatorFilter']>
>;
type NumeratorFilterMatches = Expect<
    Equals<typeof StatisticsComponent.prototype.numeratorFilter, StatisticsProps['numeratorFilter']>
>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

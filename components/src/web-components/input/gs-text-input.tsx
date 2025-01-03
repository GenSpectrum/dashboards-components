import { customElement, property } from 'lit/decorators.js';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { TextInput, type TextInputProps } from '../../preact/textInput/text-input';
import type { Equals, Expect } from '../../utils/typeAssertions';
import { PreactLitAdapter } from '../PreactLitAdapter';

/**
 *
 * ## Context
 *
 * This component provides a text input field to specify filters for arbitrary fields of this LAPIS instance.
 *
 * @fires {CustomEvent<Record<string, string>>} gs-text-input-changed
 * Fired when the input field is changed.
 * The `details` of this event contain an object with the `lapisField` as key and the input value as value.
 * Example:
 * ```
 * {
 *  "host": "Homo sapiens"
 * }
 *  ```
 */
@customElement('gs-text-input')
export class TextInputComponent extends PreactLitAdapter {
    /**
     * The initial value to use for this text input.
     */
    @property()
    initialValue: string | undefined = undefined;

    /**
     * A LAPIS filter to fetch the number of sequences for.
     *
     * The `lapisFilter` will be sent as is to LAPIS to select the data.
     * It must be a valid LAPIS filter object.
     */
    @property({ type: Object })
    lapisFilter: Record<string, string | string[] | number | null | boolean | undefined> & {
        nucleotideMutations?: string[];
        aminoAcidMutations?: string[];
        nucleotideInsertions?: string[];
        aminoAcidInsertions?: string[];
    } = {};

    /**
     * Required.
     *
     * The LAPIS field name to use for this text input.
     * The field must exist on this LAPIS instance.
     */
    @property()
    lapisField = '';

    /**
     * The placeholder text to display in the input field.
     */
    @property()
    placeholderText: string | undefined = undefined;

    /**
     * The width of the component.
     *
     * Visit https://genspectrum.github.io/dashboard-components/?path=/docs/components-size-of-components--docs for more information.
     */
    @property({ type: String })
    width: string = '100%';

    override render() {
        return (
            <TextInput
                lapisFilter={this.lapisFilter}
                lapisField={this.lapisField}
                placeholderText={this.placeholderText}
                initialValue={this.initialValue}
                width={this.width}
            />
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-text-input': TextInputComponent;
    }

    interface HTMLElementEventMap {
        'gs-text-input-changed': CustomEvent<Record<string, string>>;
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'gs-text-input': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
type LapisFilterMatches = Expect<
    Equals<typeof TextInputComponent.prototype.lapisFilter, TextInputProps['lapisFilter']>
>;
type InitialValueMatches = Expect<
    Equals<typeof TextInputComponent.prototype.initialValue, TextInputProps['initialValue']>
>;
type LapisFieldMatches = Expect<Equals<typeof TextInputComponent.prototype.lapisField, TextInputProps['lapisField']>>;
type PlaceholderTextMatches = Expect<
    Equals<typeof TextInputComponent.prototype.placeholderText, TextInputProps['placeholderText']>
>;
type WidthMatches = Expect<Equals<typeof TextInputComponent.prototype.width, TextInputProps['width']>>;
/* eslint-enable @typescript-eslint/no-unused-vars, no-unused-vars */

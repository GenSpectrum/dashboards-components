import { consume } from '@lit/context';
import { type PropertyValues, ReactiveElement } from '@lit/reactive-element';
import { unsafeCSS } from 'lit';
import { render } from 'preact';
import { type JSXInternal } from 'preact/src/jsx';

import { lapisContext } from './lapis-context';
import { LAPIS_URL } from '../constants';
import { LapisUrlContext } from '../preact/LapisUrlContext';
import minMaxPercentSliderCss from '../preact/components/min-max-percent-slider.css?inline';
import tailwindStyle from '../styles/tailwind.css?inline';

import '../styles/tailwind.css';
import '../preact/components/min-max-percent-slider.css';

const tailwindElementCss = unsafeCSS(tailwindStyle);
const minMaxPercentSliderElementCss = unsafeCSS(minMaxPercentSliderCss);

export abstract class PreactLitAdapter extends ReactiveElement {
    static override styles = [tailwindElementCss, minMaxPercentSliderElementCss];

    @consume({ context: lapisContext })
    lapis: string = '';

    override update(changedProperties: PropertyValues) {
        const vdom = <LapisUrlContext.Provider value={LAPIS_URL}>{this.render()}</LapisUrlContext.Provider>;
        super.update(changedProperties);
        render(vdom, this.renderRoot);
    }

    protected abstract render(): JSXInternal.Element;
}

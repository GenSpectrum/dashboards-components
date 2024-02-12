import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';
import './container/component-container';
import './container/component-tab';
import './container/component-toolbar';
import './container/component-toolbar-button';
import './container/component-info';
import './prevalence-over-time-line-bar-chart';
import './prevalence-over-time-bubble-chart';
import './prevalence-over-time-table';
import { type NamedLapisFilter, TemporalGranularity } from '../types';
import { lapisContext } from '../lapis-context';
import { consume } from '@lit/context';
import { queryPrevalenceOverTime } from '../query/queryPrevalenceOverTime';
import { Temporal } from '../temporal';

type View = 'bar' | 'line' | 'bubble' | 'table';

export type PrevalenceOverTimeProps = {
    numerator: NamedLapisFilter | NamedLapisFilter[];
    denominator: NamedLapisFilter;
    granularity: TemporalGranularity;
    smoothingWindow: number;
    views: View[];
};

@customElement('gs-prevalence-over-time')
export class PrevalenceOverTime extends LitElement {
    @consume({ context: lapisContext })
    lapis: string = '';

    @property({ type: Object })
    numerator: NamedLapisFilter | NamedLapisFilter[] = { displayName: '' };

    @property({ type: Object })
    denominator: NamedLapisFilter = { displayName: '' };

    @property({ type: String })
    granularity: TemporalGranularity = 'day';

    @property({ type: Number })
    smoothingWindow: number = 0;

    @property({ type: Array })
    views: View[] = ['bar', 'line', 'bubble', 'table'];

    private fetchingTask = new Task(this, {
        task: async ([lapis, numerator, denominator, granularity, smoothingWindow], { signal }) => {
            return queryPrevalenceOverTime(numerator, denominator, granularity, smoothingWindow, lapis, signal);
        },
        args: () =>
            [this.lapis, this.numerator, this.denominator, this.granularity, this.smoothingWindow, this.views] as const,
    });

    override render() {
        return this.fetchingTask.render({
            pending: () => html`
                <h1>Prevalence over time</h1>
                Loading...
            `,
            complete: (
                // https://github.com/runem/lit-analyzer/issues/154
                // lit-analyzer complains that the generic types don't match, although they do.
                // it works, if we resolve the generic type here (TS will complain if the type here is wrong).
                data: {
                    displayName: string;
                    content: { count: number; prevalence: number; total: number; dateRange: Temporal | null }[];
                }[],
            ) => html`
                <h1>Prevalence over time</h1>

                <gs-component-container>
                    ${this.views.map(
                        (view, index) => html`
                            ${view === 'bar'
                                ? html`<gs-component-tab slot="content" title="Bar" .active="${index === 0}">
                                          <gs-prevalence-over-time-line-bar-chart
                                              .data=${data}
                                              type="bar"
                                          ></gs-prevalence-over-time-line-bar-chart>
                                      </gs-component-tab>
                                      <gs-component-toolbar slot="toolbar" .active="${index === 0}">
                                          <gs-component-toolbar-button>Linear</gs-component-toolbar-button>
                                      </gs-component-toolbar>
                                      <gs-component-info slot="info">
                                          <p>
                                              Here, we can provide some info about the chart, the methods, the data,
                                              etc.
                                          </p>
                                      </gs-component-info> `
                                : ''}
                            ${view === 'line'
                                ? html`<gs-component-tab slot="content" title="Line" .active="${index === 0}">
                                          <gs-prevalence-over-time-line-bar-chart
                                              .data=${data}
                                              type="line"
                                          ></gs-prevalence-over-time-line-bar-chart>
                                      </gs-component-tab>
                                      <gs-component-toolbar slot="toolbar" .active="${index === 0}">
                                          test2
                                      </gs-component-toolbar>
                                      <gs-component-info slot="info">
                                          <p>test2</p>
                                      </gs-component-info> `
                                : ''}
                            ${view === 'bubble'
                                ? html`<gs-component-tab slot="content" title="Bubble" .active="${index === 0}">
                                          <gs-prevalence-over-time-bubble-chart
                                              .data=${data}
                                              .granularity=${this.granularity}
                                          ></gs-prevalence-over-time-bubble-chart>
                                      </gs-component-tab>
                                      <gs-component-toolbar slot="toolbar" .active="${index === 0}">
                                          test2
                                      </gs-component-toolbar>
                                      <gs-component-info slot="info">
                                          <p>test2</p>
                                      </gs-component-info> `
                                : ''}
                            ${view === 'table'
                                ? html`<gs-component-tab slot="content" title="Table" .active="${index === 0}">
                                          <gs-prevalence-over-time-table
                                              .data=${data}
                                              .granularity=${this.granularity}
                                          ></gs-prevalence-over-time-table>
                                      </gs-component-tab>
                                      <gs-component-toolbar slot="toolbar" .active="${index === 0}">
                                          test3
                                      </gs-component-toolbar>
                                      <gs-component-info slot="info">
                                          <p>test3</p>
                                      </gs-component-info> `
                                : ''}
                        `,
                    )}
                </gs-component-container>
            `,
            error: (e) => html`<p>Error: ${e}</p>`,
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-prevalence-over-time': PrevalenceOverTime;
    }
}

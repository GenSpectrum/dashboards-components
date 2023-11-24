import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { getGlobalDataManager } from './query/data';
import { FetchAggregatedQuery } from './query/FetchAggregatedQuery';
import { MapQuery } from './query/MapQuery';
import './tabs';
import './prevalence-over-time-chart';
import './prevalence-over-time-table';
import { GroupByAndSumQuery } from './query/GroupByAndSumQuery';
import { type LapisFilter, TemporalGranularity } from './types';
import { SortQuery } from './query/SortQuery';
import { DivisionQuery } from './query/DivisionQuery';
import { getMinMaxString } from './utils';
import { FillMissingQuery } from './query/FillMissingQuery';
import { generateAllInRange } from './temporal-utils';
import { SlidingQuery } from './query/SlidingQuery';
import { Query } from './query/Query';
import { lapisContext } from './lapis-context';
import { consume } from '@lit/context';

@customElement('prevalence-over-time')
export class PrevalenceOverTime extends LitElement {
    static override styles = css`
        :host {
            display: block;
            border: solid 3px gray;
            padding: 16px;
            max-width: 800px;
        }
    `;

    @consume({ context: lapisContext })
    lapis: string = '';

    @property({ type: Object })
    numerator: LapisFilter = {};

    @property({ type: Object })
    denominator: LapisFilter = {};

    @property({ type: String })
    granularity: TemporalGranularity = 'day';

    @property({ type: Number })
    smoothingWindow: number = 0;

    private fetchingTask = new Task(this, {
        task: async ([lapis, numerator, denominator, granularity, smoothingWindow], { signal }) => {
            const fetchNumerator = new FetchAggregatedQuery<{
                date: string | null;
            }>(numerator, ['date']);
            const fetchDenominator = new FetchAggregatedQuery<{
                date: string | null;
            }>(denominator, ['date']);
            const mapNumerator = new MapQuery(fetchNumerator, (d) => mapDateToGranularityRange(d, granularity));
            const mapDenominator = new MapQuery(fetchDenominator, (d) => mapDateToGranularityRange(d, granularity));
            const groupByNumerator = new GroupByAndSumQuery(mapNumerator, 'dateRange', 'count');
            const groupByDenominator = new GroupByAndSumQuery(mapDenominator, 'dateRange', 'count');
            const fillDenominator = new FillMissingQuery(
                groupByDenominator,
                'dateRange',
                getMinMaxString,
                (min, max) => generateAllInRange(min, max, granularity),
                (key) => ({ dateRange: key, count: 0 }),
            );
            const sortNumerator = new SortQuery(groupByNumerator, dateRangeCompare);
            const sortDenominator = new SortQuery(fillDenominator, dateRangeCompare);
            let smoothNumerator: Query<{ dateRange: string | null; count: number }> = sortNumerator;
            let smoothDenominator: Query<{ dateRange: string | null; count: number }> = sortDenominator;
            if (smoothingWindow >= 1) {
                smoothNumerator = new SlidingQuery(sortNumerator, smoothingWindow, averageSmoothing);
                smoothDenominator = new SlidingQuery(sortDenominator, smoothingWindow, averageSmoothing);
            }
            const divide = new DivisionQuery(smoothNumerator, smoothDenominator, 'dateRange', 'count', 'prevalence');
            return getGlobalDataManager(lapis).evaluateQuery(divide, signal);
        },
        args: () => [this.lapis, this.numerator, this.denominator, this.granularity, this.smoothingWindow] as const,
    });

    override render() {
        return this.fetchingTask.render({
            pending: () => html`
                <h1>Prevalence over time</h1>
                Loading...
            `,
            complete: (data) => html`
                <h1>Prevalence over time</h1>

                <gs-tabs>
                    <gs-tab title="Bar chart" active="true">
                        <prevalence-over-time-chart .data=${data.content} type="bar"></prevalence-over-time-chart>
                    </gs-tab>
                    <gs-tab title="Line chart">
                        <prevalence-over-time-chart .data=${data.content} type="line"></prevalence-over-time-chart>
                    </gs-tab>
                    <gs-tab title="Table">
                        <prevalence-over-time-table
                            .data=${data.content}
                            .granularity=${this.granularity}
                        ></prevalence-over-time-table>
                    </gs-tab>
                </gs-tabs>
            `,
            error: (e) => html`<p>Error: ${e}</p>`,
        });
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'prevalence-over-time': PrevalenceOverTime;
    }
}

function mapDateToGranularityRange(d: { date: string | null; count: number }, granularity: TemporalGranularity) {
    let dateRange: string | null = null;
    if (d.date !== null) {
        switch (granularity) {
            case 'day':
                dateRange = d.date;
                break;
            case 'month':
                dateRange = `${new Date(d.date).getFullYear()}-${(new Date(d.date).getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}`;
                break;
            case 'year':
                dateRange = new Date(d.date).getFullYear().toString();
                break;
        }
    }
    return {
        dateRange,
        count: d.count,
    };
}

function dateRangeCompare(a: { dateRange: string | null }, b: { dateRange: string | null }) {
    if (a.dateRange === null) {
        return 1;
    }
    if (b.dateRange === null) {
        return -1;
    }
    return a.dateRange.localeCompare(b.dateRange);
}

function averageSmoothing(slidingWindow: { dateRange: string | null; count: number }[]) {
    const average = slidingWindow.reduce((acc, curr) => acc + curr.count, 0) / slidingWindow.length;
    const centerIndex = Math.floor(slidingWindow.length / 2);
    return { dateRange: slidingWindow[centerIndex].dateRange, count: average };
}

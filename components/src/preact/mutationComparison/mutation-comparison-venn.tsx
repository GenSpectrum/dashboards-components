import { type ActiveElement, Chart, type ChartConfiguration, type ChartEvent, registerables } from 'chart.js';
import { ArcSlice, extractSets, VennDiagramController } from 'chartjs-chart-venn';
import { type FunctionComponent } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import { type MutationData } from './queryMutationData';
import { type Dataset } from '../../operator/Dataset';
import GsChart from '../components/chart';
import { type ProportionInterval } from '../components/proportion-selector';

Chart.register(...registerables, VennDiagramController, ArcSlice);

export interface MutationComparisonVennProps {
    data: Dataset<MutationData>;
    proportionInterval: ProportionInterval;
    maintainAspectRatio: boolean;
}

export const MutationComparisonVenn: FunctionComponent<MutationComparisonVennProps> = ({
    data,
    proportionInterval,
    maintainAspectRatio,
}) => {
    const [selectedDatasetIndex, setSelectedDatasetIndex] = useState<null | number>(null);

    const sets = useMemo(
        () =>
            extractSets(
                data.content
                    .map((mutationData) => ({
                        displayName: mutationData.displayName,
                        data: mutationData.data.filter(
                            (mutationEntry) =>
                                mutationEntry.proportion >= proportionInterval.min &&
                                mutationEntry.proportion <= proportionInterval.max,
                        ),
                    }))
                    .map((mutationData) => {
                        return {
                            label: mutationData.displayName,
                            values: mutationData.data.map((mutationEntry) => mutationEntry.mutation.toString()),
                        };
                    }),
            ),
        [data, proportionInterval],
    );

    const config: ChartConfiguration = useMemo(
        () => ({
            type: 'venn',
            data: sets,
            options: {
                maintainAspectRatio,
                scales: {
                    x: {
                        ticks: {
                            color: 'black',
                            font: {
                                size: 20,
                            },
                        },
                    },
                    y: {
                        ticks: {
                            color: 'blue',
                            font: {
                                size: 20,
                            },
                        },
                    },
                },
                events: ['click'],
                onClick(_: ChartEvent, elements: ActiveElement[]) {
                    if (elements.length === 0) {
                        setSelectedDatasetIndex(null);
                    }
                },
                backgroundColor: '#f5f5f5',
                animation: false,
                layout: {
                    padding: 30,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        filter: ({ dataIndex }) => {
                            setSelectedDatasetIndex(dataIndex);
                            return false;
                        },
                    },
                },
            },
        }),
        [sets],
    );

    if (data.content.length > 5) {
        return <div>Too many datasets to display. Maximum are five. </div>;
    }

    return (
        <div className='h-full flex flex-col'>
            <div className='flex-1'>
                <GsChart configuration={config} />
            </div>
            <p class='flex flex-wrap break-words m-2'>{getSelectedMutationsDescription(selectedDatasetIndex, sets)}</p>
        </div>
    );
};

const noElementSelectedMessage = 'You have no elements selected. Click in the venn diagram to select.';

function getSelectedMutationsDescription(
    selectedDatasetIndex: number | null,
    sets: ReturnType<typeof extractSets<string>>,
) {
    if (selectedDatasetIndex === null) {
        return noElementSelectedMessage;
    }

    const values = sets.datasets[0].data[selectedDatasetIndex].values;
    const label = sets.datasets[0].data[selectedDatasetIndex].label;
    return `${label}: ${values.join(', ')}` || '';
}

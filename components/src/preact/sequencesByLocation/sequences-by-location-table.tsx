import { type FunctionComponent } from 'preact';

import type { EnhancedLocationsTableData } from '../../query/computeMapLocationData';
import { type AggregateData, compareAscending } from '../../query/queryAggregateData';
import { Table } from '../components/table';
import { formatProportion } from '../shared/table/formatProportion';

type SequencesByLocationTableProps = {
    tableData: AggregateData | EnhancedLocationsTableData;
    lapisLocationField: string;
    pageSize: boolean | number;
};

export const SequencesByLocationTable: FunctionComponent<SequencesByLocationTableProps> = ({
    tableData,
    lapisLocationField,
    pageSize,
}) => {
    const headers = [
        {
            name: lapisLocationField,
            sort: {
                compare: compareAscending,
            },
        },
        {
            name: 'count',
            sort: true,
        },
        {
            name: 'proportion',
            sort: true,
            formatter: (cell: number) => formatProportion(cell),
        },
        ...('isShownOnMap' in tableData[0]
            ? [{ id: 'isShownOnMap', name: 'shown on map', sort: true, width: '20%' }]
            : []),
    ];

    return <Table data={tableData} columns={headers} pageSize={pageSize} />;
};

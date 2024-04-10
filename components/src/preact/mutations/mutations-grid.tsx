import { type Row } from 'gridjs';
import { type FunctionComponent } from 'preact';

import { type SequenceType, type SubstitutionOrDeletionEntry } from '../../types';
import { bases } from '../../utils/mutations';
import { type ProportionInterval } from '../components/proportion-selector';
import { Table, tableStyle } from '../components/table';
import { sortMutationPositions } from '../shared/sort/sortMutationPositions';
import { formatProportion } from '../shared/table/formatProportion';

type MutationCell = {
    isReference: boolean;
    value: number;
};

type AdditionalColumnInfo = {
    isReference: boolean;
};

interface MutationsGridProps {
    data: SubstitutionOrDeletionEntry[];
    sequenceType: SequenceType;
    proportionInterval: ProportionInterval;
}

export type GridTableRow = (string | number | { isReference: boolean })[];

export const MutationsGrid: FunctionComponent<MutationsGridProps> = ({ data, sequenceType, proportionInterval }) => {
    const getHeaders = () => {
        return [
            {
                name: 'Position',
                sort: {
                    compare: (a: string, b: string) => {
                        return sortMutationPositions(a, b);
                    },
                },
            },
            ...getBasesHeaders(),
        ];
    };

    const getBasesHeaders = () => {
        // This is a workaround, since gridjs does not support sorting of object cells in conjunction with the formatter
        // here each presented table cell is represented by two cells,
        // one for the value and one for the reference information

        const getAdditionalInfo = (columnIndex: number, row: Row) => {
            const numberOfNonBasesColumns = 1;
            return row.cell(numberOfNonBasesColumns + 1 + 2 * columnIndex).data as AdditionalColumnInfo;
        };

        return bases[sequenceType]
            .map((base, index) => {
                return [
                    {
                        name: base,
                        sort: true,
                        formatter: (cell: number) => formatProportion(cell),
                        attributes: (cell: number, row: Row) => {
                            // grid-js: the cell and row are null for header cells
                            if (row === null) {
                                return {};
                            }

                            return styleCells({
                                value: cell,
                                ...getAdditionalInfo(index, row),
                            });
                        },
                    },
                    { name: `additionalInfo for ${base}`, hidden: true },
                ];
            })
            .flat();
    };

    const styleCells = (cell: MutationCell) => {
        if (cell.isReference || cell.value < 0.0001) {
            return {
                style: {
                    ...tableStyle.td,
                    color: 'gray',
                },
            };
        }
        return {};
    };

    const getTableData = (data: SubstitutionOrDeletionEntry[], sequenceType: SequenceType) => {
        const basesOfView = bases[sequenceType];
        const positionsToProportionAtBase = new Map<string, Map<string, number>>();
        const referenceBases = new Map<string, string>();

        for (const mutationEntry of data) {
            const position =
                (mutationEntry.mutation.segment ? `${mutationEntry.mutation.segment}:` : '') +
                mutationEntry.mutation.position;
            referenceBases.set(position, mutationEntry.mutation.valueAtReference);

            const initiallyFillPositionsToProportionAtBase = () => {
                if (!positionsToProportionAtBase.has(position)) {
                    const empty = new Map();
                    basesOfView.forEach((base) => empty.set(base, 0));
                    empty.set(mutationEntry.mutation.valueAtReference, 1);
                    positionsToProportionAtBase.set(position, empty);
                }
            };
            initiallyFillPositionsToProportionAtBase();

            const substitutionValue =
                mutationEntry.type === 'substitution' ? mutationEntry.mutation.substitutionValue : '-';

            const subtractSubstitutionValue = () => {
                const proportionAtBase = positionsToProportionAtBase.get(position)!;
                proportionAtBase.set(substitutionValue, mutationEntry.proportion);
                proportionAtBase.set(
                    mutationEntry.mutation.valueAtReference,
                    proportionAtBase.get(mutationEntry.mutation.valueAtReference)! - mutationEntry.proportion,
                );
            };
            subtractSubstitutionValue();
        }
        const orderedPositionsToProportionAtBase = [...positionsToProportionAtBase.entries()]
            .map(([position, proportionsAtBase]) => ({ position, proportions: proportionsAtBase }))
            .sort((a, b) => {
                return sortMutationPositions(a.position, b.position);
            });

        return orderedPositionsToProportionAtBase.map((proportionsForBaseAtPosition) => {
            return [
                proportionsForBaseAtPosition.position,
                ...bases[sequenceType]
                    .map((base) => {
                        return [
                            proportionsForBaseAtPosition.proportions.get(base)!,
                            { isReference: base === referenceBases.get(proportionsForBaseAtPosition.position) },
                        ];
                    })
                    .flat(),
            ];
        });
    };

    const byProportion = (row: GridTableRow) => {
        const numbersAndIsReference = row.filter(
            (cell): cell is number | { isReference: boolean } => typeof cell !== 'string',
        );

        return numbersAndIsReference.some((cell, index) => {
            if (!(typeof cell === 'number')) {
                return false;
            }

            const associatedIsReference = numbersAndIsReference[index + 1] as { isReference: boolean };
            return (
                !associatedIsReference.isReference && cell >= proportionInterval.min && cell <= proportionInterval.max
            );
        });
    };

    const tableData = getTableData(data, sequenceType).filter(byProportion);

    return <Table data={tableData} columns={getHeaders()} pagination={true} />;
};

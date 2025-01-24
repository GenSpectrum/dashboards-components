import { Fragment, type FunctionComponent } from 'preact';
import { useRef } from 'preact/hooks';

import { type MutationOverTimeDataMap } from './MutationOverTimeData';
import { type MutationOverTimeMutationValue } from '../../query/queryMutationsOverTime';
import { type Deletion, type Substitution } from '../../utils/mutations';
import { type Temporal, type TemporalClass, toTemporalClass, YearMonthDayClass } from '../../utils/temporalClass';
import { type ColorScale, getColorWithingScale, getTextColorForScale } from '../components/color-scale-selector';
import Tooltip, { type TooltipPosition } from '../components/tooltip';
import { formatProportion } from '../shared/table/formatProportion';

export interface MutationsOverTimeGridProps {
    data: MutationOverTimeDataMap;
    colorScale: ColorScale;
    maxNumberOfGridRows?: number;
}

const MAX_NUMBER_OF_GRID_ROWS = 100;
const MUTATION_CELL_WIDTH_REM = 8;

const MutationsOverTimeGrid: FunctionComponent<MutationsOverTimeGridProps> = ({
    data,
    colorScale,
    maxNumberOfGridRows,
}) => {
    const currentMaxNumberOfGridRows = maxNumberOfGridRows ?? MAX_NUMBER_OF_GRID_ROWS;
    const allMutations = data.getFirstAxisKeys();
    const shownMutations = allMutations.slice(0, currentMaxNumberOfGridRows);

    const dates = data.getSecondAxisKeys();

    const gridRef = useRef<HTMLDivElement>(null);

    return (
        <>
            {allMutations.length > currentMaxNumberOfGridRows && (
                <div className='pl-2'>
                    Showing {currentMaxNumberOfGridRows} of {allMutations.length} mutations. You can narrow the filter
                    to reduce the number of mutations.
                </div>
            )}
            {allMutations.length === 0 && (
                <div className={'flex justify-center'}>No data available for your filters.</div>
            )}
            <div
                ref={gridRef}
                style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${shownMutations.length}, 24px)`,
                    gridTemplateColumns: `${MUTATION_CELL_WIDTH_REM}rem repeat(${dates.length}, minmax(0.05rem, 1fr))`,
                }}
            >
                {shownMutations.map((mutation, rowIndex) => {
                    return (
                        <Fragment key={`fragment-${mutation.toString()}`}>
                            <div
                                key={`mutation-${mutation.toString()}`}
                                style={{ gridRowStart: rowIndex + 1, gridColumnStart: 1 }}
                            >
                                <MutationCell mutation={mutation} />
                            </div>
                            {dates.map((date, columnIndex) => {
                                const value = data.get(mutation, date) ?? null;
                                const tooltipPosition = getTooltipPosition(
                                    rowIndex,
                                    shownMutations.length,
                                    columnIndex,
                                    dates.length,
                                );
                                return (
                                    <div
                                        style={{ gridRowStart: rowIndex + 1, gridColumnStart: columnIndex + 2 }}
                                        key={`${mutation.toString()}-${date.toString()}`}
                                    >
                                        <ProportionCell
                                            value={value}
                                            date={date}
                                            mutation={mutation}
                                            tooltipPosition={tooltipPosition}
                                            colorScale={colorScale}
                                        />
                                    </div>
                                );
                            })}
                        </Fragment>
                    );
                })}
            </div>
        </>
    );
};

function getTooltipPosition(rowIndex: number, rows: number, columnIndex: number, columns: number) {
    const tooltipX = rowIndex < rows / 2 || rowIndex < 6 ? 'bottom' : 'top';
    const tooltipY = columnIndex < columns / 2 ? 'start' : 'end';
    return `${tooltipX}-${tooltipY}` as const;
}

const ProportionCell: FunctionComponent<{
    value: MutationOverTimeMutationValue;
    date: Temporal;
    mutation: Substitution | Deletion;
    tooltipPosition: TooltipPosition;
    colorScale: ColorScale;
}> = ({ value, mutation, date, tooltipPosition, colorScale }) => {
    const dateClass = toTemporalClass(date);

    const tooltipContent = (
        <div>
            <p>
                <span className='font-bold'>{dateClass.englishName()}</span>
            </p>
            <p>({timeIntervalDisplay(dateClass)})</p>
            <p>{mutation.code}</p>
            {value === null ? (
                <p>No data</p>
            ) : (
                <>
                    <p>Proportion: {formatProportion(value.proportion)}</p>
                    {value.count !== null && value.totalCount !== null && (
                        <p>
                            Count: {value.count} / {value.totalCount} total
                        </p>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className={'py-1 w-full h-full'}>
            <Tooltip content={tooltipContent} position={tooltipPosition}>
                <div
                    style={{
                        backgroundColor: getColorWithingScale(value?.proportion, colorScale),
                        color: getTextColorForScale(value?.proportion, colorScale),
                    }}
                    className={`w-full h-full text-center hover:font-bold text-xs group @container`}
                >
                    <span className='invisible @[2rem]:visible'>
                        {value === null ? '' : formatProportion(value.proportion, 0)}
                    </span>
                </div>
            </Tooltip>
        </div>
    );
};

const timeIntervalDisplay = (date: TemporalClass) => {
    if (date instanceof YearMonthDayClass) {
        return date.toString();
    }

    return `${date.firstDay.toString()} - ${date.lastDay.toString()}`;
};

const MutationCell: FunctionComponent<{ mutation: Substitution | Deletion }> = ({ mutation }) => {
    return <div className='text-center'>{mutation.code}</div>;
};

export default MutationsOverTimeGrid;

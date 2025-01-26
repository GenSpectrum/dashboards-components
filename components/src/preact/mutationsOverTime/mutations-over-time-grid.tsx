import { Fragment, type FunctionComponent } from 'preact';
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';

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

    const [dates, allMutations, shownMutations] = useMemo(
        () => [
            data.getSecondAxisKeys(),
            data.getFirstAxisKeys(),
            data.getFirstAxisKeys().slice(0, currentMaxNumberOfGridRows)
        ],
        [data]
    );


    const gridRef = useRef<HTMLDivElement>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const canvasHeight = 700;



    const [tooltip, setTooltip] = useState<{ x: number, y: number, value: MutationOverTimeMutationValue, date: Temporal, mutation: Substitution | Deletion } | null>(null);

    const labelWidth = 120;
    const cellWidth = (canvasWidth - labelWidth) / dates.length;
    const cellHeight = 15;
    const rowHeight = 20;
    const yOffset = 20;
    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            const canvas = canvasRef.current;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.x - rect.left;
                const mouseY = event.y - rect.top;

                const column = Math.floor((mouseX - labelWidth) / cellWidth)
                const row = Math.floor((mouseY - yOffset) / rowHeight);

                if (column > dates.length || row > shownMutations.length || column < 0 || row < 0) {
                    return;
                }

                const mutation = shownMutations[row];
                const date = dates[column];

                const value = data.get(mutation, date) ?? null;
                setTooltip({ x: event.clientX, y: event.clientY, value, date, mutation });
            }
        },
        [cellWidth, data, dates, shownMutations]
    );

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                setCanvasWidth(containerRef.current.offsetWidth);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
            setCanvasWidth(containerRef.current.offsetWidth);
        }

        return () => resizeObserver.disconnect();
    }, []);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ratio = 4;
            // canvas.width = canvasWidth * ratio;
            // canvas.height = canvasHeight * ratio;
            // canvas.style.width = `${canvasWidth}px`;
            // canvas.style.height = `${canvasWidth}px`;
            canvas.getContext("2d")

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

                ctx.clearRect(0, 0, canvasWidth, 700)
                canvas.addEventListener('mousemove', handleMouseMove);
                canvas.addEventListener('mouseleave', () => setTooltip(null));

                shownMutations.forEach((mutation, rowIndex) => {
                    const y = yOffset + rowHeight * rowIndex;
                    ctx.fillStyle = 'black';
                    ctx.font = '400 14px sans-serif';
                    ctx.textBaseline = 'middle'
                    ctx.textAlign = "left";
                    ctx.fillText(mutation.code, 10, 10 + y);

                    ctx.textAlign = "center";
                    dates.forEach((date, columnIndex) => {
                        const cellX = labelWidth + columnIndex * cellWidth;
                        const value = data.get(mutation, date) ?? null;
                        ctx.fillStyle = getColorWithingScale(value?.proportion, colorScale);
                        ctx.fillRect(cellX, y, cellWidth, cellHeight);

                        if (cellWidth > 32 && value !== null) {
                            ctx.font = '400 12px sans-serif';
                            ctx.fillStyle = getTextColorForScale(value.proportion, colorScale);
                            ctx.fillText(formatProportion(value.proportion), cellX + cellWidth / 2, 8 + y);
                        }
                    })
                });
            }
        }
    }, [data, canvasWidth]);

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
            <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
                <canvas ref={canvasRef} width={canvasWidth} height={700} />
            </div>
            {tooltip && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltip.x + 10,
                        top: tooltip.y + 10,
                        background: 'white',
                        padding: '5px',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                    }}
                >
                    <p>
                        <span className='font-bold'>{toTemporalClass(tooltip.date).englishName()}</span>
                    </p>
                    <p>({timeIntervalDisplay(toTemporalClass(tooltip.date))})</p>
                    <p>{tooltip.mutation.code}</p>
                    {tooltip.value === null ? (
                        <p>No data</p>
                    ) : (
                        <>
                            <p>Proportion: {formatProportion(tooltip.value.proportion)}</p>
                            {tooltip.value.count !== null && tooltip.value.totalCount !== null && (
                                <p>
                                    Count: {tooltip.value.count} / {tooltip.value.totalCount} total
                                </p>
                            )}
                        </>
                    )}
                </div>
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

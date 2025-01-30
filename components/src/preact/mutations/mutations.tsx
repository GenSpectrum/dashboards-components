import { type FunctionComponent } from 'preact';
import { type Dispatch, type StateUpdater, useState } from 'preact/hooks';
import z from 'zod';

import { getInsertionsTableData } from './getInsertionsTableData';
import { getMutationsTableData } from './getMutationsTableData';
import { MutationsGrid } from './mutations-grid';
import { InsertionsTable } from './mutations-insertions-table';
import MutationsTable from './mutations-table';
import { filterMutationsData, type QueriedMutationsData, queryMutationsData } from './queryMutations';
import {
    type InsertionEntry,
    lapisFilterSchema,
    sequenceTypeSchema,
    type SubstitutionOrDeletionEntry,
    views,
} from '../../types';
import { useLapisUrl } from '../LapisUrlContext';
import { CsvDownloadButton } from '../components/csv-download-button';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { DeletionsLink, InsertionsLink, ProportionExplanation, SubstitutionsLink } from '../components/mutation-info';
import { type DisplayedMutationType, MutationTypeSelector } from '../components/mutation-type-selector';
import { NoDataDisplay } from '../components/no-data-display';
import type { ProportionInterval } from '../components/proportion-selector';
import { ProportionSelectorDropdown } from '../components/proportion-selector-dropdown';
import { ResizeContainer } from '../components/resize-container';
import { type DisplayedSegment, SegmentSelector, useDisplayedSegments } from '../components/segment-selector';
import Tabs from '../components/tabs';
import { useQuery } from '../useQuery';

const mutationsViewSchema = z.union([z.literal(views.table), z.literal(views.grid), z.literal(views.insertions)]);
export type MutationsView = z.infer<typeof mutationsViewSchema>;

const mutationsPropsSchema = z.object({
    lapisFilter: lapisFilterSchema,
    baselineLapisFilter: lapisFilterSchema.optional(),
    sequenceType: sequenceTypeSchema,
    views: mutationsViewSchema.array(),
    pageSize: z.union([z.boolean(), z.number()]),
    width: z.string(),
    height: z.string().optional(),
});
export type MutationsProps = z.infer<typeof mutationsPropsSchema>;

export const Mutations: FunctionComponent<MutationsProps> = (componentProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} componentProps={componentProps} schema={mutationsPropsSchema}>
            <ResizeContainer size={size}>
                <MutationsInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

export const MutationsInner: FunctionComponent<MutationsProps> = (componentProps) => {
    const lapis = useLapisUrl();
    const { lapisFilter, baselineLapisFilter, sequenceType } = componentProps;

    const { data, error, isLoading } = useQuery(async () => {
        return queryMutationsData(lapisFilter, baselineLapisFilter, sequenceType, lapis);
    }, [lapisFilter, baselineLapisFilter, sequenceType, lapis]);

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        throw error;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return <MutationsTabs mutationsData={data} originalComponentProps={componentProps} />;
};

type MutationTabsProps = {
    mutationsData: QueriedMutationsData;
    originalComponentProps: MutationsProps;
};

const MutationsTabs: FunctionComponent<MutationTabsProps> = ({ mutationsData, originalComponentProps }) => {
    const [proportionInterval, setProportionInterval] = useState({ min: 0.05, max: 1 });

    const [displayedSegments, setDisplayedSegments] = useDisplayedSegments(originalComponentProps.sequenceType);
    const [displayedMutationTypes, setDisplayedMutationTypes] = useState<DisplayedMutationType[]>([
        { label: 'Substitutions', checked: true, type: 'substitution' },
        { label: 'Deletions', checked: true, type: 'deletion' },
    ]);

    const filteredData = filterMutationsData(mutationsData, displayedSegments, displayedMutationTypes);

    const getTab = (view: MutationsView) => {
        switch (view) {
            case 'table':
                return {
                    title: 'Table',
                    content: (
                        <MutationsTable
                            data={filteredData.tableData}
                            baselineSubstitutionsOrDeletions={mutationsData.baselineSubstitutionsOrDeletions}
                            overallVariantCount={mutationsData.overallVariantCount}
                            proportionInterval={proportionInterval}
                            pageSize={originalComponentProps.pageSize}
                        />
                    ),
                };
            case 'grid':
                return {
                    title: 'Grid',
                    content: (
                        <MutationsGrid
                            data={filteredData.gridData}
                            sequenceType={originalComponentProps.sequenceType}
                            proportionInterval={proportionInterval}
                            pageSize={originalComponentProps.pageSize}
                        />
                    ),
                };
            case 'insertions':
                return {
                    title: 'Insertions',
                    content: (
                        <InsertionsTable data={filteredData.insertions} pageSize={originalComponentProps.pageSize} />
                    ),
                };
        }
    };

    const tabs = originalComponentProps.views.map((view) => getTab(view));

    const toolbar = (activeTab: string) => (
        <Toolbar
            activeTab={activeTab}
            displayedSegments={displayedSegments}
            setDisplayedSegments={setDisplayedSegments}
            displayedMutationTypes={displayedMutationTypes}
            setDisplayedMutationTypes={setDisplayedMutationTypes}
            filteredData={filteredData}
            proportionInterval={proportionInterval}
            setProportionInterval={setProportionInterval}
            originalComponentProps={originalComponentProps}
            baselineSubstitutionsOrDeletions={mutationsData.baselineSubstitutionsOrDeletions}
            overallVariantCount={mutationsData.overallVariantCount}
        />
    );

    return <Tabs tabs={tabs} toolbar={toolbar} />;
};

type ToolbarProps = {
    activeTab: string;
    displayedSegments: DisplayedSegment[];
    setDisplayedSegments: (segments: DisplayedSegment[]) => void;
    displayedMutationTypes: DisplayedMutationType[];
    setDisplayedMutationTypes: (types: DisplayedMutationType[]) => void;
    filteredData: { tableData: SubstitutionOrDeletionEntry[]; insertions: InsertionEntry[] };
    proportionInterval: ProportionInterval;
    setProportionInterval: Dispatch<StateUpdater<ProportionInterval>>;
    originalComponentProps: MutationsProps;
    baselineSubstitutionsOrDeletions: SubstitutionOrDeletionEntry[] | undefined;
    overallVariantCount: number;
};

const Toolbar: FunctionComponent<ToolbarProps> = ({
    activeTab,
    displayedSegments,
    setDisplayedSegments,
    displayedMutationTypes,
    setDisplayedMutationTypes,
    filteredData,
    proportionInterval,
    setProportionInterval,
    originalComponentProps,
    baselineSubstitutionsOrDeletions,
    overallVariantCount,
}) => {
    return (
        <>
            <SegmentSelector displayedSegments={displayedSegments} setDisplayedSegments={setDisplayedSegments} />
            {activeTab === 'Table' && (
                <MutationTypeSelector
                    setDisplayedMutationTypes={setDisplayedMutationTypes}
                    displayedMutationTypes={displayedMutationTypes}
                />
            )}
            {(activeTab === 'Table' || activeTab === 'Grid') && (
                <>
                    <ProportionSelectorDropdown
                        proportionInterval={proportionInterval}
                        setMinProportion={(min) => setProportionInterval((prev) => ({ ...prev, min }))}
                        setMaxProportion={(max) => setProportionInterval((prev) => ({ ...prev, max }))}
                    />
                    <CsvDownloadButton
                        className='mx-1 btn btn-xs'
                        getData={() =>
                            getMutationsTableData(
                                filteredData.tableData,
                                baselineSubstitutionsOrDeletions,
                                overallVariantCount,
                                proportionInterval,
                            )
                        }
                        filename='substitutions_and_deletions.csv'
                    />
                </>
            )}
            {activeTab === 'Insertions' && (
                <CsvDownloadButton
                    className='mx-1 btn btn-xs'
                    getData={() =>
                        getInsertionsTableData(filteredData.insertions).map((row) => {
                            return {
                                insertion: row.insertion.toString(),
                                count: row.count,
                            };
                        })
                    }
                    filename='insertions.csv'
                />
            )}
            <MutationsInfo originalComponentProps={originalComponentProps} />
            <Fullscreen />
        </>
    );
};

type MutationsInfoProps = {
    originalComponentProps: MutationsProps;
};

const MutationsInfo: FunctionComponent<MutationsInfoProps> = ({ originalComponentProps }) => {
    const lapis = useLapisUrl();

    return (
        <Info>
            <InfoHeadline1>Mutations</InfoHeadline1>
            <InfoParagraph>
                This shows mutations of a variant. There are three types of mutations: <SubstitutionsLink />,{' '}
                <DeletionsLink /> and <InsertionsLink />.
            </InfoParagraph>
            <ProportionExplanation />
            <InfoComponentCode componentName='mutations' params={originalComponentProps} lapisUrl={lapis} />
        </Info>
    );
};

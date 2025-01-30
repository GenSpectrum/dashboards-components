import { type FunctionComponent } from 'preact';
import { type Dispatch, type StateUpdater, useMemo, useState } from 'preact/hooks';
import z from 'zod';

import { getMutationComparisonTableData } from './getMutationComparisonTableData';
import { MutationComparisonTable } from './mutation-comparison-table';
import { MutationComparisonVenn } from './mutation-comparison-venn';
import { filterMutationData, type MutationData, queryMutationData } from './queryMutationData';
import { namedLapisFilterSchema, sequenceTypeSchema, views } from '../../types';
import { useLapisUrl } from '../LapisUrlContext';
import { CsvDownloadButton } from '../components/csv-download-button';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoHeadline2, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { DeletionsLink, ProportionExplanation, SubstitutionsLink } from '../components/mutation-info';
import { type DisplayedMutationType, MutationTypeSelector } from '../components/mutation-type-selector';
import { NoDataDisplay } from '../components/no-data-display';
import { type ProportionInterval } from '../components/proportion-selector';
import { ProportionSelectorDropdown } from '../components/proportion-selector-dropdown';
import { ResizeContainer } from '../components/resize-container';
import { type DisplayedSegment, SegmentSelector, useDisplayedSegments } from '../components/segment-selector';
import Tabs from '../components/tabs';
import { getMaintainAspectRatio } from '../shared/charts/getMaintainAspectRatio';
import { useQuery } from '../useQuery';

export const mutationComparisonViewSchema = z.union([z.literal(views.table), z.literal(views.venn)]);
export type MutationComparisonView = z.infer<typeof mutationComparisonViewSchema>;

const mutationComparisonPropsSchema = z.object({
    width: z.string(),
    height: z.string().optional(),
    lapisFilters: z.array(namedLapisFilterSchema).min(1),
    sequenceType: sequenceTypeSchema,
    views: z.array(mutationComparisonViewSchema),
    pageSize: z.union([z.boolean(), z.number()]),
});

export type MutationComparisonProps = z.infer<typeof mutationComparisonPropsSchema>;

export const MutationComparison: FunctionComponent<MutationComparisonProps> = (componentProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} componentProps={componentProps} schema={mutationComparisonPropsSchema}>
            <ResizeContainer size={size}>
                <MutationComparisonInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

const MutationComparisonInner: FunctionComponent<MutationComparisonProps> = (componentProps) => {
    const { lapisFilters, sequenceType } = componentProps;
    const lapis = useLapisUrl();

    const { data, error, isLoading } = useQuery(async () => {
        return queryMutationData(lapisFilters, sequenceType, lapis);
    }, [lapisFilters, sequenceType, lapis]);

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        throw error;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return <MutationComparisonTabs data={data.mutationData} originalComponentProps={componentProps} />;
};

type MutationComparisonTabsProps = {
    data: MutationData[];
    originalComponentProps: MutationComparisonProps;
};

const MutationComparisonTabs: FunctionComponent<MutationComparisonTabsProps> = ({ data, originalComponentProps }) => {
    const [proportionInterval, setProportionInterval] = useState({ min: 0.5, max: 1 });
    const [displayedMutationTypes, setDisplayedMutationTypes] = useState<DisplayedMutationType[]>([
        { label: 'Substitutions', checked: true, type: 'substitution' },
        { label: 'Deletions', checked: true, type: 'deletion' },
    ]);
    const [displayedSegments, setDisplayedSegments] = useDisplayedSegments(originalComponentProps.sequenceType);

    const filteredData = useMemo(
        () => filterMutationData(data, displayedSegments, displayedMutationTypes),
        [data, displayedSegments, displayedMutationTypes],
    );

    const maintainAspectRatio = getMaintainAspectRatio(originalComponentProps.height);

    const getTab = (view: MutationComparisonView) => {
        switch (view) {
            case 'table':
                return {
                    title: 'Table',
                    content: (
                        <MutationComparisonTable
                            data={{ content: filteredData }}
                            proportionInterval={proportionInterval}
                            pageSize={originalComponentProps.pageSize}
                        />
                    ),
                };
            case 'venn':
                return {
                    title: 'Venn',
                    content: (
                        <MutationComparisonVenn
                            data={{ content: filteredData }}
                            proportionInterval={proportionInterval}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
        }
    };

    const tabs = originalComponentProps.views.map((view) => getTab(view));

    return (
        <Tabs
            tabs={tabs}
            toolbar={
                <Toolbar
                    displayedSegments={displayedSegments}
                    setDisplayedSegments={setDisplayedSegments}
                    displayedMutationTypes={displayedMutationTypes}
                    setDisplayedMutationTypes={setDisplayedMutationTypes}
                    filteredData={filteredData}
                    proportionInterval={proportionInterval}
                    setProportionInterval={setProportionInterval}
                    originalComponentProps={originalComponentProps}
                />
            }
        />
    );
};

type ToolbarProps = {
    displayedSegments: DisplayedSegment[];
    setDisplayedSegments: (segments: DisplayedSegment[]) => void;
    displayedMutationTypes: DisplayedMutationType[];
    setDisplayedMutationTypes: (types: DisplayedMutationType[]) => void;
    filteredData: MutationData[];
    proportionInterval: ProportionInterval;
    setProportionInterval: Dispatch<StateUpdater<ProportionInterval>>;
    originalComponentProps: MutationComparisonProps;
};

const Toolbar: FunctionComponent<ToolbarProps> = ({
    displayedSegments,
    setDisplayedSegments,
    displayedMutationTypes,
    setDisplayedMutationTypes,
    filteredData,
    proportionInterval,
    setProportionInterval,
    originalComponentProps,
}) => {
    return (
        <>
            <ProportionSelectorDropdown
                proportionInterval={proportionInterval}
                setMinProportion={(min) => setProportionInterval((prev) => ({ ...prev, min }))}
                setMaxProportion={(max) => setProportionInterval((prev) => ({ ...prev, max }))}
            />
            <SegmentSelector displayedSegments={displayedSegments} setDisplayedSegments={setDisplayedSegments} />
            <MutationTypeSelector
                displayedMutationTypes={displayedMutationTypes}
                setDisplayedMutationTypes={setDisplayedMutationTypes}
            />
            <CsvDownloadButton
                className='mx-1 btn btn-xs'
                getData={() => getMutationComparisonTableData({ content: filteredData }, proportionInterval)}
                filename='mutation_comparison.csv'
            />
            <MutationComparisonInfo originalComponentProps={originalComponentProps} />
            <Fullscreen />
        </>
    );
};

type MutationComparisonInfoProps = {
    originalComponentProps: MutationComparisonProps;
};

const MutationComparisonInfo: FunctionComponent<MutationComparisonInfoProps> = ({ originalComponentProps }) => {
    const lapis = useLapisUrl();
    return (
        <Info>
            <InfoHeadline1>Info for mutation comparison</InfoHeadline1>
            <InfoParagraph>
                This displays <SubstitutionsLink /> and <DeletionsLink /> of several variants. It shows mutations where
                the proportion for any given variant falls within the range you can select in the component's toolbar.
            </InfoParagraph>
            <ProportionExplanation />
            {originalComponentProps.views.includes(views.table) && (
                <>
                    <InfoHeadline2>Table View</InfoHeadline2>
                    <InfoParagraph>
                        The table view displays the proportion of mutations that appear in any of the variants.
                    </InfoParagraph>
                </>
            )}
            {originalComponentProps.views.includes(views.venn) && (
                <>
                    <InfoHeadline2>Venn Diagram View</InfoHeadline2>
                    <InfoParagraph>
                        The Venn diagram view illustrates which mutations overlap between the variants and which are
                        exclusive to specific variants. Mutations overlap if their proportion falls within the selected
                        range for two variants. If the proportion of a mutation is within the selected range for one
                        variant but not for the other, the mutation is considered exclusive to that variant.
                    </InfoParagraph>
                </>
            )}
            <InfoComponentCode componentName='mutation-comparison' params={originalComponentProps} lapisUrl={lapis} />
        </Info>
    );
};

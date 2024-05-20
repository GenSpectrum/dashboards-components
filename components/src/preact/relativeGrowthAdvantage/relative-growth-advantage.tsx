import { type FunctionComponent } from 'preact';
import { useContext, useState } from 'preact/hooks';

import RelativeGrowthAdvantageChart from './relative-growth-advantage-chart';
import {
    queryRelativeGrowthAdvantage,
    type RelativeGrowthAdvantageData,
} from '../../query/queryRelativeGrowthAdvantage';
import { type LapisFilter } from '../../types';
import { LapisUrlContext } from '../LapisUrlContext';
import { ErrorBoundary } from '../components/error-boundary';
import { ErrorDisplay } from '../components/error-display';
import Headline from '../components/headline';
import Info, { InfoHeadline1, InfoHeadline2, InfoLink, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { NoDataDisplay } from '../components/no-data-display';
import { ResizeContainer } from '../components/resize-container';
import { ScalingSelector } from '../components/scaling-selector';
import Tabs from '../components/tabs';
import { type ScaleType } from '../shared/charts/getYAxisScale';
import { useQuery } from '../useQuery';

export type View = 'line';

export interface RelativeGrowthAdvantageProps extends RelativeGrowthAdvantagePropsInner {
    width: string;
    headline?: string;
}

export interface RelativeGrowthAdvantagePropsInner {
    numerator: LapisFilter;
    denominator: LapisFilter;
    generationTime: number;
    views: View[];
    height: string;
    lapisDateField: string;
}

export const RelativeGrowthAdvantage: FunctionComponent<RelativeGrowthAdvantageProps> = ({
    views,
    width,
    height,
    numerator,
    denominator,
    generationTime,
    headline = 'Relative growth advantage',
    lapisDateField,
}) => {
    const size = { height, width };

    return (
        <ErrorBoundary size={size} headline={headline}>
            <ResizeContainer size={size}>
                <Headline heading={headline}>
                    <RelativeGrowthAdvantageInner
                        views={views}
                        numerator={numerator}
                        denominator={denominator}
                        generationTime={generationTime}
                        lapisDateField={lapisDateField}
                        height={height}
                    />
                </Headline>
            </ResizeContainer>
        </ErrorBoundary>
    );
};

export const RelativeGrowthAdvantageInner: FunctionComponent<RelativeGrowthAdvantagePropsInner> = ({
    numerator,
    denominator,
    generationTime,
    views,
    height,
    lapisDateField,
}) => {
    const lapis = useContext(LapisUrlContext);
    const [yAxisScaleType, setYAxisScaleType] = useState<ScaleType>('linear');

    const { data, error, isLoading } = useQuery(
        () => queryRelativeGrowthAdvantage(numerator, denominator, generationTime, lapis, lapisDateField),
        [lapis, numerator, denominator, generationTime, views],
    );

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        return <ErrorDisplay error={error} />;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return (
        <RelativeGrowthAdvantageTabs
            data={data}
            yAxisScaleType={yAxisScaleType}
            setYAxisScaleType={setYAxisScaleType}
            views={views}
            generationTime={generationTime}
            height={height}
        />
    );
};

type RelativeGrowthAdvantageTabsProps = {
    data: NonNullable<RelativeGrowthAdvantageData>;
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    views: View[];
    generationTime: number;
    height: string;
};

const RelativeGrowthAdvantageTabs: FunctionComponent<RelativeGrowthAdvantageTabsProps> = ({
    data,
    yAxisScaleType,
    setYAxisScaleType,
    views,
    generationTime,
    height,
}) => {
    const getTab = (view: View) => {
        switch (view) {
            case 'line':
                return {
                    title: 'Line',
                    content: (
                        <RelativeGrowthAdvantageChart
                            data={{
                                ...data.estimatedProportions,
                                observed: data.observedProportions,
                                params: data.params,
                            }}
                            yAxisScaleType={yAxisScaleType}
                        />
                    ),
                };
        }
    };

    const tabs = views.map((view) => getTab(view));
    const toolbar = () => (
        <RelativeGrowthAdvantageToolbar
            generationTime={generationTime}
            yAxisScaleType={yAxisScaleType}
            setYAxisScaleType={setYAxisScaleType}
            height={height}
        />
    );

    return <Tabs tabs={tabs} toolbar={toolbar} />;
};

type RelativeGrowthAdvantageToolbarProps = {
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    generationTime: number;
    height: string;
};

const RelativeGrowthAdvantageToolbar: FunctionComponent<RelativeGrowthAdvantageToolbarProps> = ({
    yAxisScaleType,
    setYAxisScaleType,
    generationTime,
    height,
}) => {
    return (
        <div class='flex'>
            <ScalingSelector yAxisScaleType={yAxisScaleType} setYAxisScaleType={setYAxisScaleType} />
            <RelativeGrowthAdvantageInfo generationTime={generationTime} height={height} />
        </div>
    );
};

const RelativeGrowthAdvantageInfo: FunctionComponent<{ generationTime: number; height: string }> = ({
    generationTime,
    height,
}) => {
    return (
        <Info height={`min(100vh, 0.8*${height}`}>
            <InfoHeadline1>Relative growth advantage</InfoHeadline1>
            <InfoParagraph>
                If variants spread pre-dominantly by local transmission across demographic groups, this estimate
                reflects the relative viral intrinsic growth advantage of the focal variant in the selected country and
                time frame. We report the relative growth advantage per {generationTime} days (in percentage; 0% means
                equal growth). Importantly, the relative growth advantage estimate reflects the advantage compared to
                the co-circulating variants. Thus, as new variants spread, the advantage of the focal variant may
                decrease. Different mechanisms can alter the intrinsic growth rate, including an intrinsic transmission
                advantage, immune evasion, and a prolonged infectious period. When absolute numbers of a variant are
                low, the growth advantage may merely reflect the current importance of introductions from abroad or the
                variant spreading in a particular demographic group. In this case, the estimate does not provide
                information on any intrinsic fitness advantages.
            </InfoParagraph>
            <InfoParagraph>
                Example: Assume that 10 infections from the focal variant and 100 infections from the co-circulating
                variants occur today and that the focal variant has a relative growth advantage of 50%. Then, if the
                number of new infections from the co-circulating variants remains at 100 in {generationTime} days from
                today, we expect the number of new infections from the focal variant to be 15.
            </InfoParagraph>

            <InfoHeadline2>Reference</InfoHeadline2>
            <InfoParagraph>
                Chen, Chaoran, et al. "Quantification of the spread of SARS-CoV-2 variant B.1.1.7 in Switzerland."
                Epidemics (2021); doi:{' '}
                <InfoLink href='https://www.sciencedirect.com/science/article/pii/S1755436521000335?via=ihub'>
                    10.1016/j.epidem.2021.100480
                </InfoLink>
            </InfoParagraph>
        </Info>
    );
};

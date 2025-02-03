import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import z from 'zod';

import RelativeGrowthAdvantageChart from './relative-growth-advantage-chart';
import {
    NotEnoughDataToComputeFitError,
    queryRelativeGrowthAdvantage,
    type RelativeGrowthAdvantageData,
} from '../../query/queryRelativeGrowthAdvantage';
import { lapisFilterSchema, views } from '../../types';
import { useLapisUrl } from '../LapisUrlContext';
import { ErrorBoundary } from '../components/error-boundary';
import { Fullscreen } from '../components/fullscreen';
import Info, { InfoComponentCode, InfoHeadline1, InfoHeadline2, InfoLink, InfoParagraph } from '../components/info';
import { LoadingDisplay } from '../components/loading-display';
import { NoDataDisplay } from '../components/no-data-display';
import { ResizeContainer } from '../components/resize-container';
import { ScalingSelector } from '../components/scaling-selector';
import Tabs from '../components/tabs';
import { getMaintainAspectRatio } from '../shared/charts/getMaintainAspectRatio';
import { axisMaxSchema } from '../shared/charts/getYAxisMax';
import { type ScaleType } from '../shared/charts/getYAxisScale';
import { useQuery } from '../useQuery';

const relativeGrowthAdvantageViewSchema = z.literal(views.line);
export type RelativeGrowthAdvantageView = z.infer<typeof relativeGrowthAdvantageViewSchema>;

export const relativeGrowthAdvantagePropsSchema = z.object({
    width: z.string(),
    height: z.string().optional(),
    numeratorFilter: lapisFilterSchema,
    denominatorFilter: lapisFilterSchema,
    generationTime: z.number(),
    views: z.array(relativeGrowthAdvantageViewSchema),
    lapisDateField: z.string().min(1),
    yAxisMaxLinear: axisMaxSchema,
    yAxisMaxLogarithmic: axisMaxSchema,
});
export type RelativeGrowthAdvantageProps = z.infer<typeof relativeGrowthAdvantagePropsSchema>;

export const RelativeGrowthAdvantage: FunctionComponent<RelativeGrowthAdvantageProps> = (componentProps) => {
    const { width, height } = componentProps;
    const size = { height, width };

    return (
        <ErrorBoundary size={size} schema={relativeGrowthAdvantagePropsSchema} componentProps={componentProps}>
            <ResizeContainer size={size}>
                <RelativeGrowthAdvantageInner {...componentProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

export const RelativeGrowthAdvantageInner: FunctionComponent<RelativeGrowthAdvantageProps> = (componentProps) => {
    const lapis = useLapisUrl();
    const { numeratorFilter, denominatorFilter, generationTime, lapisDateField } = componentProps;

    const [yAxisScaleType, setYAxisScaleType] = useState<ScaleType>('linear');

    const { data, error, isLoading } = useQuery(
        () => queryRelativeGrowthAdvantage(numeratorFilter, denominatorFilter, generationTime, lapis, lapisDateField),
        [lapis, numeratorFilter, denominatorFilter, generationTime, lapisDateField],
    );

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        if (error instanceof NotEnoughDataToComputeFitError) {
            return (
                <NoDataDisplay message='It was not possible to estimate the relative growth advantage due to insufficient data in the specified filter.' />
            );
        }
        throw error;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return (
        <RelativeGrowthAdvantageTabs
            data={data}
            yAxisScaleType={yAxisScaleType}
            setYAxisScaleType={setYAxisScaleType}
            originalComponentProps={componentProps}
        />
    );
};

type RelativeGrowthAdvantageTabsProps = {
    data: NonNullable<RelativeGrowthAdvantageData>;
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    originalComponentProps: RelativeGrowthAdvantageProps;
};

const RelativeGrowthAdvantageTabs: FunctionComponent<RelativeGrowthAdvantageTabsProps> = ({
    data,
    yAxisScaleType,
    setYAxisScaleType,
    originalComponentProps,
}) => {
    const maintainAspectRatio = getMaintainAspectRatio(originalComponentProps.height);

    const getTab = (view: RelativeGrowthAdvantageView) => {
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
                            yAxisMaxConfig={{
                                linear: originalComponentProps.yAxisMaxLinear,
                                logarithmic: originalComponentProps.yAxisMaxLogarithmic,
                            }}
                            maintainAspectRatio={maintainAspectRatio}
                        />
                    ),
                };
        }
    };

    const tabs = originalComponentProps.views.map((view) => getTab(view));
    const toolbar = () => (
        <RelativeGrowthAdvantageToolbar
            originalComponentProps={originalComponentProps}
            yAxisScaleType={yAxisScaleType}
            setYAxisScaleType={setYAxisScaleType}
        />
    );

    return <Tabs tabs={tabs} toolbar={toolbar} />;
};

type RelativeGrowthAdvantageToolbarProps = {
    yAxisScaleType: ScaleType;
    setYAxisScaleType: (scaleType: ScaleType) => void;
    originalComponentProps: RelativeGrowthAdvantageProps;
};

const RelativeGrowthAdvantageToolbar: FunctionComponent<RelativeGrowthAdvantageToolbarProps> = ({
    yAxisScaleType,
    setYAxisScaleType,
    originalComponentProps,
}) => {
    return (
        <>
            <ScalingSelector yAxisScaleType={yAxisScaleType} setYAxisScaleType={setYAxisScaleType} />
            <RelativeGrowthAdvantageInfo originalComponentProps={originalComponentProps} />
            <Fullscreen />
        </>
    );
};

const RelativeGrowthAdvantageInfo: FunctionComponent<{ originalComponentProps: RelativeGrowthAdvantageProps }> = ({
    originalComponentProps,
}) => {
    const lapis = useLapisUrl();
    const generationTime = originalComponentProps.generationTime;

    return (
        <Info>
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
            <InfoComponentCode
                componentName='relative-growth-advantage'
                params={originalComponentProps}
                lapisUrl={lapis}
            />
        </Info>
    );
};

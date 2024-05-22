import { type FunctionComponent } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import { type JSXInternal } from 'preact/src/jsx';

import { fetchAutocompletionList } from './fetchAutocompletionList';
import { LapisUrlContext } from '../LapisUrlContext';
import { ErrorBoundary } from '../components/error-boundary';
import { ErrorDisplay } from '../components/error-display';
import { LoadingDisplay } from '../components/loading-display';
import { ResizeContainer } from '../components/resize-container';
import { useQuery } from '../useQuery';

export interface LocationFilterInnerProps {
    initialValue?: string;
    fields: string[];
}

export interface LocationFilterProps extends LocationFilterInnerProps {
    width: string;
}

export const LocationFilter: FunctionComponent<LocationFilterProps> = ({ width, initialValue, fields }) => {
    const size = { width, height: '3rem' };

    return (
        <ErrorBoundary size={size}>
            <ResizeContainer size={size}>
                <LocationFilterInner initialValue={initialValue} fields={fields} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

export const LocationFilterInner = ({ initialValue, fields }: LocationFilterInnerProps) => {
    const lapis = useContext(LapisUrlContext);

    const [value, setValue] = useState(initialValue ?? '');
    const [unknownLocation, setUnknownLocation] = useState(false);

    const divRef = useRef<HTMLDivElement>(null);

    const { data, error, isLoading } = useQuery(() => fetchAutocompletionList(fields, lapis), [fields, lapis]);

    if (isLoading) {
        return <LoadingDisplay />;
    }
    if (error) {
        return <ErrorDisplay error={error} />;
    }

    const onInput = (event: JSXInternal.TargetedInputEvent<HTMLInputElement>) => {
        const inputValue = event.currentTarget.value;
        setValue(inputValue);
        if (inputValue.trim() === value.trim()) {
            return;
        }
        const eventDetail = parseLocation(inputValue, fields);
        if (hasMatchingEntry(data, eventDetail)) {
            divRef.current?.dispatchEvent(
                new CustomEvent('gs-location-changed', {
                    detail: eventDetail,
                    bubbles: true,
                    composed: true,
                }),
            );
            setUnknownLocation(false);
        } else {
            setUnknownLocation(true);
        }
    };

    return (
        <div class='flex w-full' ref={divRef}>
            <input
                type='text'
                class={`input input-bordered grow ${unknownLocation ? 'border-2 border-error' : ''}`}
                value={value}
                onInput={onInput}
                list='countries'
            />
            <datalist id='countries'>
                {data?.map((v) => {
                    const value = fields
                        .map((field) => v[field])
                        .filter((value) => value !== null)
                        .join(' / ');
                    return <option key={value} value={value} />;
                })}
            </datalist>
        </div>
    );
};

const parseLocation = (location: string, fields: string[]) => {
    const fieldValues = location.split('/').map((part) => part.trim());
    return fieldValues.reduce((acc, fieldValue, i) => ({ ...acc, [fields[i]]: fieldValue }), {});
};

const hasMatchingEntry = (data: Record<string, string>[] | null, eventDetail: Record<string, string>) => {
    if (data === null) {
        return false;
    }

    const matchingEntries = Object.entries(eventDetail)
        .filter(([, value]) => value !== undefined)
        .reduce((filteredData, [key, value]) => filteredData.filter((it) => it[key] === value), data);

    return matchingEntries.length > 0;
};

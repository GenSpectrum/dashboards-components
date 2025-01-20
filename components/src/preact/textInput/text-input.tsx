import { type FunctionComponent } from 'preact';
import { useContext } from 'preact/hooks';
import z from 'zod';

import { fetchStringAutocompleteList } from './fetchStringAutocompleteList';
import { LapisUrlContext } from '../LapisUrlContext';
import { TextInputChangedEvent } from './TextInputChangedEvent';
import { lapisFilterSchema } from '../../types';
import { DownshiftCombobox } from '../components/downshift-combobox';
import { ErrorBoundary } from '../components/error-boundary';
import { LoadingDisplay } from '../components/loading-display';
import { NoDataDisplay } from '../components/no-data-display';
import { ResizeContainer } from '../components/resize-container';
import { useQuery } from '../useQuery';

const textSelectorPropsSchema = z.object({
    lapisField: z.string().min(1),
    placeholderText: z.string().optional(),
    value: z.string().optional(),
});
const textInputInnerPropsSchema = textSelectorPropsSchema.extend({ lapisFilter: lapisFilterSchema });
const textInputPropsSchema = textInputInnerPropsSchema.extend({
    width: z.string(),
});

export type TextInputInnerProps = z.infer<typeof textInputInnerPropsSchema>;
export type TextInputProps = z.infer<typeof textInputPropsSchema>;
type TextSelectorProps = z.infer<typeof textSelectorPropsSchema>;

export const TextInput: FunctionComponent<TextInputProps> = (props) => {
    const { width, ...innerProps } = props;
    const size = { width, height: '3rem' };

    return (
        <ErrorBoundary size={size} layout='horizontal' componentProps={props} schema={textInputPropsSchema}>
            <ResizeContainer size={size}>
                <TextInputInner {...innerProps} />
            </ResizeContainer>
        </ErrorBoundary>
    );
};

const TextInputInner: FunctionComponent<TextInputInnerProps> = ({
    value,
    lapisField,
    placeholderText,
    lapisFilter,
}) => {
    const lapis = useContext(LapisUrlContext);

    const { data, error, isLoading } = useQuery(
        () => fetchStringAutocompleteList({ lapis, field: lapisField, lapisFilter }),
        [lapisField, lapis, lapisFilter],
    );

    if (isLoading) {
        return <LoadingDisplay />;
    }

    if (error !== null) {
        throw error;
    }

    if (data === null) {
        return <NoDataDisplay />;
    }

    return <TextSelector lapisField={lapisField} value={value} placeholderText={placeholderText} data={data} />;
};

const TextSelector = ({
    lapisField,
    value,
    placeholderText,
    data,
}: TextSelectorProps & {
    data: string[];
}) => {
    return (
        <DownshiftCombobox
            allItems={data}
            value={value}
            filterItemsByInputValue={filterByInputValue}
            createEvent={(item: string | null) => new TextInputChangedEvent({ [lapisField]: item ?? undefined })}
            itemToString={(item: string | undefined | null) => item ?? ''}
            placeholderText={placeholderText}
            formatItemInList={(item: string) => {
                return <span>{item}</span>;
            }}
        />
    );
};

function filterByInputValue(item: string, inputValue: string | undefined | null) {
    if (inputValue === undefined || inputValue === null || inputValue === '') {
        return true;
    }
    return item?.toLowerCase().includes(inputValue?.toLowerCase() || '');
}

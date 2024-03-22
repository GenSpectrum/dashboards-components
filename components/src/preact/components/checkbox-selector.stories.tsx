import { expect, fn, waitFor, within } from '@storybook/test';
import { Meta, StoryObj } from '@storybook/preact';
import { CheckboxItem, CheckboxSelector, CheckboxSelectorProps } from './checkbox-selector';
import { useState } from 'preact/hooks';

const meta: Meta<CheckboxSelectorProps> = {
    title: 'Component/Checkbox Selector',
    component: CheckboxSelector,
    argTypes: {
        setItems: { action: true },
    },
    parameters: { fetchMock: {} },
};

export default meta;

export const CheckboxSelectorStory: StoryObj<CheckboxSelectorProps> = {
    render: (args) => {
        const [items, setItems] = useState(args.items);

        return (
            <CheckboxSelector
                items={items}
                label={args.label}
                setItems={(items: CheckboxItem[]) => {
                    args.setItems(items);
                    setItems(items);
                }}
            />
        );
    },
    args: {
        items: [
            { checked: false, label: 'item1' },
            { checked: false, label: 'item2' },
        ],
        label: 'Some label',
        setItems: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const open = () => canvas.getByText('Some label', { exact: false });
        open().click();

        const item1 = canvas.getByLabelText('item1', { exact: false });
        item1.click();

        await waitFor(() =>
            expect(args.setItems).toHaveBeenCalledWith([
                { checked: true, label: 'item1' },
                { checked: false, label: 'item2' },
            ]),
        );
    },
};

import { type FunctionComponent } from 'preact';

export type Size = {
    width: string;
    height?: string;
};

export interface ResizeContainerProps {
    size: Size;
}

export const ResizeContainer: FunctionComponent<ResizeContainerProps> = ({ children, size }) => {
    return (
        <div style={size} className='bg-white'>
            {children}
        </div>
    );
};

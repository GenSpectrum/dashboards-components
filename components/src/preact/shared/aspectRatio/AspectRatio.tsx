import { type PropsWithChildren } from 'react';

export function AspectRatio({ children, aspectRatio }: PropsWithChildren<{ aspectRatio?: number }>) {
    if (aspectRatio === undefined) {
        return children;
    }

    return (
        <div class={`w-full relative`} style={{ paddingTop: `${aspectRatio}%` }}>
            <div className='absolute inset-0'>{children}</div>
        </div>
    );
}

import { type ErrorWorkerStatus, type LoadingWorkerStatus, type SuccessWorkerStatus } from './useWebWorker';
import { UserFacingError } from '../components/error-display';

export async function workerFunction<R>(queryFunction: () => R) {
    try {
        postMessage({ status: 'loading' } satisfies LoadingWorkerStatus);

        const workerResponse = await queryFunction();

        postMessage({
            status: 'success',
            data: workerResponse,
        } satisfies SuccessWorkerStatus<R>);
    } catch (error) {
        postMessage(
            (error instanceof UserFacingError
                ? {
                      status: 'error',
                      userFacing: true,
                      headline: error.headline,
                      error,
                  }
                : {
                      status: 'error',
                      userFacing: false,
                      error: error instanceof Error ? error : new Error(`${error}`),
                  }) satisfies ErrorWorkerStatus,
        );
    }
}

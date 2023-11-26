import { expect } from '@open-wc/testing';

export function expectEqualAfterSorting<T>(actual: T[], expected: T[], compareFn?: (a: T, b: T) => number) {
    return expect(actual.sort(compareFn)).deep.equal(expected.sort(compareFn));
}

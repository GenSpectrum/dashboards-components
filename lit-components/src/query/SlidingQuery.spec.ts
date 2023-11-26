import { MockQuery } from './MockQuery';
import { SlidingQuery } from './SlidingQuery';
import { expectEqualAfterSorting } from '../test-utils';

describe('SlidingQuery', () => {
    it('should slide the values', async () => {
        const child = new MockQuery([
            { id: 1, value: 1 },
            { id: 2, value: 2 },
            { id: 3, value: 3 },
            { id: 4, value: 4 },
            { id: 5, value: 5 },
        ]);
        const query = new SlidingQuery(child, 3, (values) => {
            let sum = 0;
            for (const { value } of values) {
                sum += value;
            }
            return { id: values[1].id, sum };
        });
        const result = await query.evaluate('lapis');
        await expectEqualAfterSorting(
            result.content,
            [
                { id: 2, sum: 6 },
                { id: 3, sum: 9 },
                { id: 4, sum: 12 },
            ],
            (a, b) => a.id - b.id,
        );
    });
});

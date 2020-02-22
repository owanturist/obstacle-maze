import {
    Order,
    Comparable
} from 'frctl/Basics';
import {
    empty
} from './index';

class ID implements Comparable<ID> {
    public constructor(private readonly id: number) {}

    public compareTo(another: ID): Order {
        if (this.id < another.id) {
            return Order.LT;
        }

        if (this.id > another.id) {
            return Order.GT;
        }

        return Order.EQ;
    }
}

it('PriorityQueue.size()', () => {
    const pq = empty();

    expect(pq.size()).toBe(0);

    pq.enqueue(new ID(0));
    expect(pq.size()).toBe(1);

    pq.enqueue(new ID(0));
    expect(pq.size()).toBe(2);

    pq.enqueue(new ID(0));
    expect(pq.size()).toBe(3);

    pq.dequeue();
    expect(pq.size()).toBe(2);

    pq.enqueue(new ID(0));
    expect(pq.size()).toBe(3);

    pq.dequeue();
    expect(pq.size()).toBe(2);

    pq.dequeue();
    expect(pq.size()).toBe(1);

    pq.dequeue();
    expect(pq.size()).toBe(0);
});

it('PriorityQueue.isEmpty()', () => {
    const pq = empty();

    expect(pq.isEmpty()).toBe(true);

    pq.enqueue(new ID(0));
    expect(pq.isEmpty()).toBe(false);

    pq.dequeue();
    expect(pq.isEmpty()).toBe(true);
});

it('PriorityQueue.enqueue()', () => {
    const pq = empty();

    pq.enqueue(new ID(8));
    pq.enqueue(new ID(2));
    pq.enqueue(new ID(4));
    pq.enqueue(new ID(3));
    pq.enqueue(new ID(9));
    pq.enqueue(new ID(1));
    pq.enqueue(new ID(7));
    pq.enqueue(new ID(0));
    pq.enqueue(new ID(5));
    pq.enqueue(new ID(6));

    expect(pq.dequeue()).toEqual(new ID(0));
    expect(pq.dequeue()).toEqual(new ID(1));
    expect(pq.dequeue()).toEqual(new ID(2));
    expect(pq.dequeue()).toEqual(new ID(3));
    expect(pq.dequeue()).toEqual(new ID(4));
    expect(pq.dequeue()).toEqual(new ID(5));
    expect(pq.dequeue()).toEqual(new ID(6));
    expect(pq.dequeue()).toEqual(new ID(7));
    expect(pq.dequeue()).toEqual(new ID(8));
    expect(pq.dequeue()).toEqual(new ID(9));
});

it('Priority.dequeue()', () => {
    const pq = empty();

    const _0 = new ID(0);
    const _1 = new ID(1);
    const _2 = new ID(2);

    pq.enqueue(_0);
    pq.enqueue(_1);
    pq.enqueue(_2);

    expect(pq.dequeue()).toBe(_0);
    expect(pq.dequeue()).toBe(_1);
    expect(pq.dequeue()).toBe(_2);
    expect(() => pq.dequeue()).toThrowError(new RangeError('PriorityQueue is empty'));
});

import {
    Order,
    Comparable
} from 'frctl/Basics';

export interface PriorityQueue<T extends Comparable<T>> {
    isEmpty(): boolean;

    size(): number;

    enqueue(item: T): void;

    dequeue(): T;
}

const swap = <T>(x: number, y: number, arr: Array<T>): void => {
    if (x === y) {
        return;
    }

    const tmp = arr[ x ];

    arr[ x ] = arr[ y ];
    arr[ y ] = tmp;
};

class PriorityQueueImpl<T extends Comparable<T>> implements PriorityQueue<T> {
    public readonly heap: Array<T> = new Array(1);

    public isEmpty(): boolean {
        return this.size() === 0;
    }

    public size(): number {
        return this.heap.length - 1;
    }

    public enqueue(item: T): void {
        this.heap.push(item);
        this.swim(this.heap.length - 1);
    }

    public dequeue(): T {
        if (this.isEmpty()) {
            throw new RangeError('PriorityQueue is empty');
        }

        const item = this.heap[ 1 ];
        const last = this.heap.pop();

        if (this.isEmpty()) {
            return item;
        }

        this.heap[ 1 ] = last as T;
        this.sink(1);

        return item;
    }

    private compare(left: number, right: number): Order {
        return this.heap[ left ].compareTo(this.heap[ right ]);
    }

    private swim(index: number): void {
        let child = index;

        while (child > 1 && this.compare(Math.floor(child / 2), child).isGT()) {
            const parent = Math.floor(child / 2);

            swap(child, parent, this.heap);
            child = parent;
        }
    }

    private sink(index: number): void {
        const size = this.size();
        let parent = index;

        while (parent * 2 <= size) {
            let child = parent * 2;

            if (child < size && this.compare(child, child + 1).isGT()) {
                child++;
            }

            if (!this.compare(child, parent).isLT()) {
                break;
            }

            swap(child, parent, this.heap);

            parent = child;
        }
    }
}

export const empty = <T extends Comparable<T>>(): PriorityQueue<T> => new PriorityQueueImpl();

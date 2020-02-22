import {
    Order,
    Comparable
} from 'frctl/Basics';
import Maybe from 'frctl/Maybe';
import Dict from 'frctl/Dict';

import {
    Setup,
    Obstacle,
    ID
} from './index';

interface PriorityQueue<T extends Comparable<T>> {
    enqueue(item: T): void;

    dequeue(): T;

    isEmpty(): boolean;
}

interface Stack<T> {
    push(item: T): Stack<T>;

    pop(): Maybe<T>;

    toList(): Array<T>;
}

export type Path = Array<ID>;

class Way implements Comparable<Way> {
    public constructor(
        private readonly time: number,
        private readonly path: Stack<ID>
    ) {}

    public compareTo(another: Way): Order {
        if (this.time < another.time) {
            return Order.LT;
        }

        if (this.time > another.time) {
            return Order.GT;
        }

        return Order.EQ;
    }
}

class BFS {
    private readonly visited: Array<boolean> = [];
    private readonly pq: PriorityQueue<Way>;

    public constructor(
        private readonly cols: number,
        private readonly rows: number,
        private readonly start: ID,
        private readonly target: ID,
        private readonly obstacle: Dict<ID, Obstacle>
    ) {}

    private schedule(col: number, row: number): void {
        if (col < 0 || col >= this.cols - 1 || row < 0 || row >= this.rows - 1) {
            return;
        }

        const id = this.cols * row + col;

        if (this.visited[ id ]) {
            return;
        }
    }

    private lookup(id: ID): void {
        const col = id % this.cols;
        const row = Math.floor(id / this.cols);

        // a circle lookup from top-left clockwise, just for fun
        this.schedule(col - 1, row - 1);  // top-left
        this.schedule(col, row - 1);      // top
        this.schedule(col + 1, row - 1);  // top-right
        this.schedule(col + 1, row);      // right
        this.schedule(col + 1, row + 1);  // bottom-right
        this.schedule(col, row + 1);      // bottom
        this.schedule(col - 1, row + 1);  // bottom-left
        this.schedule(col - 1, row);      // left
    }

    public findShortestPaths(): Array<Path> {
        this.lookup(this.start);

        return [];
    }
}

/**
 * We trust the Maze flow so `setup` is valid.
 */
export const solve = (setup: Setup): Array<Path> => {
    const bfs = new BFS(setup.cols, setup.rows, setup.start, setup.target, setup.obstacles);

    return bfs.findShortestPaths();
};

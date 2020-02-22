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


const NORAML_DURATION = 1;
const GRAVEL_DURATION = NORAML_DURATION * 2;


interface PriorityQueue<T extends Comparable<T>> {
    enqueue(item: T): void;

    dequeue(): T;

    isEmpty(): boolean;
}

interface NonEmptyStack<T> {
    push(item: T): NonEmptyStack<T>;

    peek(): T;

    toList(): Array<T>;
}

export type Path = Array<ID>;

class Way implements Comparable<Way> {
    public constructor(
        private readonly time: number,
        private readonly path: NonEmptyStack<ID>
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

    public last(): ID {
        return this.path.peek();
    }

    public step(duration: number, id: ID): Way {
        return new Way(this.time + duration, this.path.push(id));
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
        private readonly obstacles: Array<null | Obstacle>
    ) {}

    private schedule(way: Way, col: number, row: number): void {
        if (col < 0 || col >= this.cols - 1 || row < 0 || row >= this.rows - 1) {
            return;
        }

        const id = this.cols * row + col;

        if (this.visited[ id ]) {
            return;
        }
    }

    private lookup(way: Way): void {
        const id = way.last();
        const col = id % this.cols;
        const row = Math.floor(id / this.cols);

        // a circle lookup from top-left clockwise, just for fun
        this.schedule(way, col - 1, row - 1);  // top-left
        this.schedule(way, col,     row - 1);  // top
        this.schedule(way, col + 1, row - 1);  // top-right
        this.schedule(way, col + 1, row    );  // right
        this.schedule(way, col + 1, row + 1);  // bottom-right
        this.schedule(way, col,     row + 1);  // bottom
        this.schedule(way, col - 1, row + 1);  // bottom-left
        this.schedule(way, col - 1, row    );  // left
    }

    public findShortestPaths(): Array<Path> {
        // this.lookup(this.start);

        return [];
    }
}

/**
 * We trust the Maze flow so `setup` is valid.
 */
export const solve = (setup: Setup): Array<Path> => {
    const bfs = new BFS(
        setup.cols,
        setup.rows,
        setup.start,
        setup.target,
        setup.obstacles
    );

    return bfs.findShortestPaths();
};

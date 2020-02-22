import {
    Order,
    Comparable
} from 'frctl/Basics';

import {
    Setup,
    Obstacle
} from './index';
import {
    NonEmptyStack,
    init as initNonEmptyStack
} from '../NonEmptyStack';
import {
    PriorityQueue,
    empty as emptyPriorityQueue
} from '../PriorityQueue';

const NORAML_DURATION = 1;
const GRAVEL_DURATION = NORAML_DURATION * 2;


export type Path = Array<[ number, number ]>;

class Way implements Comparable<Way> {
    public static start(startLocation: [ number, number ]): Way {
        return new Way(0, initNonEmptyStack(startLocation));
    }

    private constructor(
        private readonly time: number,
        private readonly path: NonEmptyStack<[ number, number ]>
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

    public coordinates(): [ number, number ] {
        return this.path.peek();
    }

    public next(duration: number, row: number, col: number): Way {
        return new Way(this.time + duration, this.path.push([ row, col ]));
    }

    public getPath(): Path {
        return this.path.toList();
    }
}

/**
 * It doesn't really needed to build a graph with linked edges
 * because the grid has specific rules where each vertices
 * has exact edges. But it can use Breadth-First Search for sure.
 *
 * The reason why BFS is choosen is that it has to explore all
 * possible shortest ways to look for portals.
 * If it doesn't have portals it might use more intelligent algorithm.
 */
class BFS {
    private readonly rows: number;
    private readonly cols: number;
    private readonly visited: Array<boolean>;
    private readonly portalsOut: Array<[ number, number ]>;
    private readonly pq: PriorityQueue<Way> = emptyPriorityQueue();

    public constructor(
        private readonly start: [ number, number ],
        private readonly target: [ number, number ],
        private readonly obstacles: Array<Array<Obstacle>>
    ) {
        this.rows = obstacles.length;
        this.cols = this.rows > 0 ? obstacles[ 0 ].length : 0;
        this.visited = new Array(this.rows * this.cols);
        this.portalsOut = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (obstacles[ row ][ col ] === Obstacle.PortalOut) {
                    this.portalsOut.push([ row, col ]);
                }
            }
        }
    }

    private isVisited(row: number, col: number): boolean {
        return this.visited[ this.cols * row + col ];
    }

    private visit(row: number, col: number): void {
        this.visited[ this.cols * row + col ] = true;
    }

    private isTarget(row: number, col: number): boolean {
        return this.target[ 0 ] === row && this.target[ 1 ] === col;
    }

    private schedule(way: Way, row: number, col: number): void {
        if (col < 0 || col >= this.cols - 1
            || row < 0 || row >= this.rows - 1
            || this.isVisited(row, col)
        ) {
            return;
        }

        switch (this.obstacles[ row ][ col ]) {
            case null:
            case undefined:            // Represents just a cell empty of obstacles
            case Obstacle.PortalOut: { // PortalOut might be treated like empty cell
                return this.pq.enqueue(way.next(NORAML_DURATION, row, col));
            }

            case Obstacle.Gravel: {
                return this.pq.enqueue(way.next(GRAVEL_DURATION, row, col));
            }

            case Obstacle.PortalIn: {
                // PortalIn might be treated like empty cell
                this.pq.enqueue(way.next(NORAML_DURATION, row, col));

                // Schedule all PortalOuts
                for (const [ portalRow, portalCol ] of this.portalsOut) {
                    this.schedule(way, portalRow, portalCol);
                }
            }
        }
    }

    private lookup(way: Way): void {
        const [ row, col ] = way.coordinates();

        // a circle lookup from top-left clockwise, just for fun
        this.schedule(way, row - 1, col - 1);  // top-left
        this.schedule(way, row - 1, col,   );  // top
        this.schedule(way, row - 1, col + 1);  // top-right
        this.schedule(way, row    , col + 1);  // right
        this.schedule(way, row + 1, col + 1);  // bottom-right
        this.schedule(way, row + 1, col,   );  // bottom
        this.schedule(way, row + 1, col - 1);  // bottom-left
        this.schedule(way, row    , col - 1);  // left
    }

    public findShortestPaths(): Array<Path> {
        const paths: Array<Path> = [];

        this.lookup(Way.start(this.start));

        while (!this.pq.isEmpty()) {
            const way = this.pq.dequeue();
            const [ row, col ] = way.coordinates();

            if (this.isVisited(row, col)) {
                continue;
            }

            this.visit(row, col);

            if (this.isTarget(row, col)) {
                paths.push(way.getPath());
            }

            // in case of concuret shortest paths it has to process the rest
            // because it cannot guarantee that no one exists in queue
            // but it does that next additions are longer
            if (paths.length === 0) {
                this.lookup(way);
            }
        }

        return paths;
    }
}

/**
 * We trust the Maze flow so `setup` is valid.
 */
export const solve = (setup: Setup): Array<Path> => {
    const bfs = new BFS(
        setup.start,
        setup.target,
        setup.obstacles
    );

    return bfs.findShortestPaths();
};
